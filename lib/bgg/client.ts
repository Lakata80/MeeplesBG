import { parseBGGGame, parseHotness, parseCollection } from './parser'
import type { BggHotnessItem, BggGameDetails, BggCollectionItem } from './types'
import { execFile }  from 'node:child_process'
import { promisify } from 'node:util'

export type { BggHotnessItem, BggGameDetails, BggCollectionItem }

const execFileAsync = promisify(execFile)

const BGG_BASE = process.env.BGG_API_URL ?? 'https://boardgamegeek.com/xmlapi2'
const BGG_UA   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

// ──────────────────────────────────────────────
// Headers за стандартен fetch (без cookie)
// ──────────────────────────────────────────────
function bggHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'User-Agent':      BGG_UA,
    'Accept':          'application/xml,text/xml,text/html;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer':         'https://boardgamegeek.com/',
  }
  if (process.env.BGG_SESSION_COOKIE) h['Cookie'] = process.env.BGG_SESSION_COOKIE
  return h
}

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
// curl заявка — заобикаля Cloudflare TLS fingerprinting
// Node.js fetch се блокира от Cloudflare по JA3/JA4 TLS fingerprint.
// curl има различен fingerprint и минава проверката.
// ──────────────────────────────────────────────
const CURL_STATUS_MARK = '\n<<<HTTPSTATUS>>>'

async function curlFetch(url: string): Promise<{ status: number; body: string }> {
  const cookie = process.env.BGG_SESSION_COOKIE!
  const { stdout } = await execFileAsync(
    'curl',
    [
      '-s', '-L',
      '--max-time', '30',
      '--user-agent', BGG_UA,
      '--cookie', cookie,
      '-w', CURL_STATUS_MARK + '%{http_code}',
      url,
    ],
    { encoding: 'utf8', timeout: 35_000 },
  )

  const idx    = stdout.lastIndexOf(CURL_STATUS_MARK)
  const body   = idx >= 0 ? stdout.slice(0, idx) : stdout
  const status = idx >= 0 ? parseInt(stdout.slice(idx + CURL_STATUS_MARK.length)) : 200
  return { status: isNaN(status) ? 200 : status, body }
}

// ──────────────────────────────────────────────
// bggFetch — с retry и exponential backoff
// Ползва curl ако BGG_SESSION_COOKIE е зададен, иначе fetch
// ──────────────────────────────────────────────
async function bggFetch(url: string, maxRetries = 3): Promise<string> {
  let lastErr: Error = new Error('Unknown error')

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await rateLimit()

      if (process.env.BGG_SESSION_COOKIE) {
        const { status, body } = await curlFetch(url)
        if (status === 202) { await sleep(5000); continue }
        if (status >= 400) throw new Error(`BGG HTTP ${status}`)
        if (body.trimStart().startsWith('<!')) throw new Error(`BGG HTTP ${status} — HTML вместо XML`)
        return body
      }

      const res = await fetch(url, { headers: bggHeaders() })
      if (res.status === 202) { await sleep(5000); continue }
      if (!res.ok) throw new Error(`BGG HTTP ${res.status}`)
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
// BGG връща 202 докато подготвя колекцията — повтаряме до 5 пъти
// ──────────────────────────────────────────────
export async function fetchGameCollection(username: string): Promise<BggCollectionItem[]> {
  const url = `${BGG_BASE}/collection?username=${encodeURIComponent(username)}&subtype=boardgame&excludesubtype=boardgameexpansion&stats=1`

  for (let attempt = 0; attempt < 5; attempt++) {
    await rateLimit()

    if (process.env.BGG_SESSION_COOKIE) {
      const { status, body } = await curlFetch(url)
      if (status === 202) { await sleep(5000); continue }
      if (status >= 400) throw new Error(`BGG collection HTTP ${status}`)
      return parseCollection(body)
    }

    const res = await fetch(url, { headers: bggHeaders() })
    if (res.status === 202) { await sleep(5000); continue }
    if (!res.ok) throw new Error(`BGG collection HTTP ${res.status}`)
    return parseCollection(await res.text())
  }

  throw new Error(`BGG не върна колекцията на ${username} след 5 опита`)
}
