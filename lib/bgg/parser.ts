import { XMLParser } from 'fast-xml-parser'
import type { BggHotnessItem, BggGameDetails, BggCollectionItem } from './types'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) => ['item', 'name', 'link', 'rank'].includes(name),
  processEntities: true,
  htmlEntities: true,
})

// Картографиране на BGG family rank names към тип игра
const BGG_TYPE_MAP: Record<string, string> = {
  strategygames: 'Strategy',
  thematic: 'Thematic',
  familygames: 'Family',
  partygames: 'Party',
  abstracts: 'Abstract',
  childrensgames: 'Children',
  wargames: 'Wargame',
  customizablegames: 'Customizable',
}

function num(val: unknown): number | undefined {
  if (val === undefined || val === null) return undefined
  const n = parseFloat(String(val))
  return isNaN(n) || n === 0 ? undefined : n
}

function intVal(val: unknown): number | undefined {
  if (val === undefined || val === null) return undefined
  const n = parseInt(String(val))
  return isNaN(n) || n <= 0 ? undefined : n
}

// ──────────────────────────────────────────────
// BGG /thing?id=...&stats=1
// ──────────────────────────────────────────────
export function parseBGGGame(xml: string): BggGameDetails[] {
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed?.items?.item ?? []

  return items.map((item: unknown) => {
    const it = item as Record<string, unknown>

    const isExpansion = (it['@_type'] as string) === 'boardgameexpansion'

    // Основно заглавие (primary name)
    const names = (it['name'] as Record<string, unknown>[]) ?? []
    const primary = names.find((n) => n['@_type'] === 'primary')
    const titleEn = String(primary?.['@_value'] ?? names[0]?.['@_value'] ?? '')

    // Описание
    const descriptionEn = String(it['description'] ?? '')

    // Числови полета
    const yearPublished = intVal((it['yearpublished'] as Record<string, unknown>)?.['@_value'])
    const minPlayers   = intVal((it['minplayers'] as Record<string, unknown>)?.['@_value'])
    const maxPlayers   = intVal((it['maxplayers'] as Record<string, unknown>)?.['@_value'])
    const minPlaytime  = intVal((it['minplaytime'] as Record<string, unknown>)?.['@_value'])
    const maxPlaytime  = intVal((it['maxplaytime'] as Record<string, unknown>)?.['@_value'])
    const minAge       = intVal((it['minage'] as Record<string, unknown>)?.['@_value'])

    // Снимки
    const imageUrl    = String(it['image'] ?? '').trim() || undefined
    const thumbnailUrl = String(it['thumbnail'] ?? '').trim() || undefined

    // Линкове (категории, механики)
    const links = (it['link'] as Record<string, unknown>[]) ?? []
    const byType = (type: string) =>
      links
        .filter((l) => l['@_type'] === type)
        .map((l) => String(l['@_value']))

    const categories = byType('boardgamecategory')
    const mechanics  = byType('boardgamemechanic')

    // Статистики
    const ratings = (it['statistics'] as Record<string, unknown>)?.['ratings'] as Record<string, unknown> | undefined
    const bggRating = num((ratings?.['average'] as Record<string, unknown>)?.['@_value'])
    const weight    = num((ratings?.['averageweight'] as Record<string, unknown>)?.['@_value'])

    // Ранг и тип от ranks
    const rankItems = (ratings?.['ranks'] as Record<string, unknown>)?.['rank'] as Record<string, unknown>[] ?? []

    const boardgameRankItem = rankItems.find((r) => r['@_name'] === 'boardgame')
    const bggRankRaw = boardgameRankItem?.['@_value']
    const bggRank = bggRankRaw && bggRankRaw !== 'Not Ranked'
      ? intVal(bggRankRaw)
      : undefined

    // Типове от family ranks
    const types = rankItems
      .filter((r) => r['@_type'] === 'family' && r['@_value'] !== 'Not Ranked')
      .map((r) => BGG_TYPE_MAP[String(r['@_name'])])
      .filter((t): t is string => Boolean(t))

    return {
      id: parseInt(String(it['@_id'])),
      titleEn,
      descriptionEn,
      yearPublished,
      minPlayers,
      maxPlayers,
      minPlaytime,
      maxPlaytime,
      minAge,
      weight,
      bggRating,
      bggRank,
      imageUrl,
      thumbnailUrl,
      categories,
      mechanics,
      types: types.length > 0 ? types : [],
      isExpansion,
    } satisfies BggGameDetails
  })
}

// ──────────────────────────────────────────────
// BGG /hot?type=boardgame
// ──────────────────────────────────────────────
export function parseHotness(xml: string): BggHotnessItem[] {
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed?.items?.item ?? []

  return items.map((item: unknown) => {
    const it = item as Record<string, unknown>
    return {
      id: parseInt(String(it['@_id'])),
      rank: parseInt(String(it['@_rank'])),
      name: String((it['name'] as Record<string, unknown>)?.['@_value'] ?? ''),
      thumbnailUrl: String((it['thumbnail'] as Record<string, unknown>)?.['@_value'] ?? '') || undefined,
      yearPublished: intVal((it['yearpublished'] as Record<string, unknown>)?.['@_value']),
    }
  })
}

// ──────────────────────────────────────────────
// BGG /collection?username=...
// ──────────────────────────────────────────────
export function parseCollection(xml: string): BggCollectionItem[] {
  const parsed = parser.parse(xml)
  const items: unknown[] = parsed?.items?.item ?? []

  return items.map((item: unknown) => {
    const it = item as Record<string, unknown>
    const status = it['status'] as Record<string, unknown> ?? {}
    const stats  = it['stats'] as Record<string, unknown> ?? {}
    const rating = (stats['rating'] as Record<string, unknown>)?.['@_value']

    return {
      id: parseInt(String(it['@_objectid'])),
      name: String((it['name'] as Record<string, unknown>)?.['#text'] ?? it['name'] ?? ''),
      yearPublished: intVal((it['yearpublished'] as Record<string, unknown>)?.['#text'] ?? it['yearpublished']),
      numPlays: intVal(it['numplays']) ?? 0,
      userRating: rating && rating !== 'N/A' ? num(rating) : undefined,
      owned:      status['@_own'] === '1',
      prevOwned:  status['@_prevowned'] === '1',
      wishlist:   status['@_wish'] === '1',
      wantToPlay: status['@_wanttoplay'] === '1',
      forTrade:   status['@_fortrade'] === '1',
      thumbnailUrl: String(it['thumbnail'] ?? '') || undefined,
    }
  })
}
