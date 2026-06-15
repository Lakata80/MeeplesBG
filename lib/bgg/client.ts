import { parseBGGGame, parseHotness, parseCollection } from './parser'
import type { BggHotnessItem, BggGameDetails, BggCollectionItem } from './types'

export type { BggHotnessItem, BggGameDetails, BggCollectionItem }

const BGG_BASE = process.env.BGG_API_URL ?? 'https://boardgamegeek.com/xmlapi2'
const BGG_UA   = 'MeeplesBG/1.0 (+https://meeplesbg.bg)'

// ──────────────────────────────────────────────
// Rate limiter — 1 заявка в секунда (BGG изисква)
// ──────────────────────────────────────────────
let lastRequest = 0
const MIN_INTERVAL = 1100

async function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

async function rateLimit() {
  const elapsed = Date.now() - lastRequest
  if (elapsed < MIN_INTERVAL) await sleep(MIN_INTERVAL - elapsed)
  lastRequest = Date.now()
}

// ──────────────────────────────────────────────
// Fetch с retry (3 опита, exponential backoff)
// ──────────────────────────────────────────────
async function bggFetch(url: string, maxRetries = 3): Promise<string> {
  let lastErr: Error = new Error('Unknown error')

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await rateLimit()

      const res = await fetch(url, { headers: { 'User-Agent': BGG_UA } })

      if (res.status === 202) {
        // BGG обработва заявката — изчакай и опитай отново
        await sleep(5000)
        continue
      }
      if (!res.ok) {
        throw new Error(`BGG HTTP ${res.status}`)
      }
      return res.text()
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 2000)
      }
    }
  }
  throw lastErr
}

// ──────────────────────────────────────────────
// fetchBGGHotness — текущ "горещ" списък (50 игри)
// ──────────────────────────────────────────────
export async function fetchBGGHotness(): Promise<BggHotnessItem[]> {
  const xml = await bggFetch(`${BGG_BASE}/hot?type=boardgame`)
  return parseHotness(xml)
}

// ──────────────────────────────────────────────
// fetchBGGTop — топ игри по рейтинг, страница по страница
// Парсира HTML browse страницата на BGG за да извлече ID-тата
// ──────────────────────────────────────────────
export async function fetchBGGTop(page: number): Promise<number[]> {
  const url = `https://boardgamegeek.com/browse/boardgame?sort=rank&sortdir=asc&page=${page}`
  await rateLimit()

  const res = await fetch(url, {
    headers: {
      'User-Agent': BGG_UA,
      Accept: 'text/html',
    },
  })

  if (!res.ok) throw new Error(`BGG browse HTTP ${res.status} (страница ${page})`)

  const html = await res.text()

  // Извлича ID от href="/boardgame/{id}/..."
  const seen = new Set<number>()
  for (const [, id] of html.matchAll(/href="\/boardgame\/(\d+)\//g)) {
    const n = parseInt(id)
    if (n > 0) seen.add(n)
  }

  return [...seen]
}

// ──────────────────────────────────────────────
// fetchGameById — детайли за конкретна игра
// ──────────────────────────────────────────────
export async function fetchGameById(bggId: number): Promise<BggGameDetails | null> {
  const games = await fetchGamesByIds([bggId])
  return games[0] ?? null
}

// ──────────────────────────────────────────────
// fetchGamesByIds — batch fetch (до 200 ID-та наведнъж)
// ──────────────────────────────────────────────
export async function fetchGamesByIds(bggIds: number[]): Promise<BggGameDetails[]> {
  if (bggIds.length === 0) return []

  const BATCH = 200
  const results: BggGameDetails[] = []

  for (let i = 0; i < bggIds.length; i += BATCH) {
    const batch = bggIds.slice(i, i + BATCH)
    const url   = `${BGG_BASE}/thing?id=${batch.join(',')}&stats=1`
    const xml   = await bggFetch(url)
    results.push(...parseBGGGame(xml))
  }

  return results
}

// ──────────────────────────────────────────────
// fetchGameCollection — колекция на потребител
// ──────────────────────────────────────────────
export async function fetchGameCollection(username: string): Promise<BggCollectionItem[]> {
  const url = `${BGG_BASE}/collection?username=${encodeURIComponent(username)}&subtype=boardgame&excludesubtype=boardgameexpansion&stats=1`

  // BGG връща 202 докато подготвя колекцията — повтаряме до 5 пъти
  for (let attempt = 0; attempt < 5; attempt++) {
    await rateLimit()
    const res = await fetch(url, { headers: { 'User-Agent': BGG_UA } })

    if (res.status === 202) {
      await sleep(5000)
      continue
    }
    if (!res.ok) throw new Error(`BGG collection HTTP ${res.status}`)

    const xml = await res.text()
    return parseCollection(xml)
  }

  throw new Error(`BGG не върна колекцията на ${username} след 5 опита`)
}
