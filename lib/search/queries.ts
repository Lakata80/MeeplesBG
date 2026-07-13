import { gamesIndex } from './client'
import type { GameDocument } from './types'

const НА_СТРАНИЦА = 20

export interface SearchParams {
  query?:       string
  players?:     number   // брой играчи — minPlayers <= players <= maxPlayers
  minAge?:      number   // max допустима минимална възраст на играта
  maxPlaytime?: number   // максимално времетраене (минути)
  maxWeight?:   number   // максимална сложност (weight <= N)
  types?:       string[] // ['Strategy', 'Family', ...]
  categories?:  string[] // ['Fantasy', 'Adventure', ...]
  sort?:        'rating' | 'year' | 'name'
  page?:        number
}

export interface SearchResult {
  hits:        GameDocument[]
  totalHits:   number
  totalPages:  number
  page:        number
  hitsPerPage: number
  processingMs: number
}

// Карта за подредба
const SORT_MAP: Record<NonNullable<SearchParams['sort']>, string> = {
  rating: 'bggRating:desc',
  year:   'yearPublished:desc',
  name:   'titleBg:asc',
}

// ──────────────────────────────────────────────
// Главна функция за търсене
// ──────────────────────────────────────────────
export async function searchGames(params: SearchParams): Promise<SearchResult> {
  const {
    query       = '',
    players,
    minAge,
    maxPlaytime,
    maxWeight,
    types,
    categories,
    sort        = 'rating',
    page        = 1,
  } = params

  // ── Изгради филтъра ──────────────────────────
  const части: string[] = []

  if (players !== undefined) {
    // Игра поддържа точно players брой играчи
    части.push(`minPlayers <= ${players} AND maxPlayers >= ${players}`)
  }

  if (minAge !== undefined) {
    // Игра подходяща за тази минимална възраст
    части.push(`minAge <= ${minAge}`)
  }

  if (maxPlaytime !== undefined) {
    // Игра, която се вписва в времевия лимит
    части.push(`maxPlaytime <= ${maxPlaytime}`)
  }

  if (maxWeight !== undefined) {
    // Игри с ниска или средна сложност
    части.push(`weight <= ${maxWeight}`)
  }

  if (types && types.length > 0) {
    // 'Cooperative' не съществува в BGG type ranks — кооперативните игри
    // са категоризирани като categories: ['Cooperative Game']
    const бизКооп = types.filter((t) => t !== 'Cooperative')
    const имаКооп = types.includes('Cooperative')

    const typeFilters: string[] = []
    if (бизКооп.length > 0) {
      typeFilters.push(`types IN [${бизКооп.map((t) => `"${t}"`).join(', ')}]`)
    }
    if (имаКооп) {
      typeFilters.push(`mechanics IN ["Cooperative Game"]`)
    }

    if (typeFilters.length === 1) {
      части.push(typeFilters[0])
    } else {
      части.push(`(${typeFilters.join(' OR ')})`)
    }
  }

  if (categories && categories.length > 0) {
    const списък = categories.map((c) => `"${c}"`).join(', ')
    части.push(`categories IN [${списък}]`)
  }

  const filter = части.length > 0 ? части.join(' AND ') : undefined

  // ── Изпълни търсенето ────────────────────────
  const резултат = await gamesIndex.search(query, {
    page,
    hitsPerPage: НА_СТРАНИЦА,
    filter,
    sort: [SORT_MAP[sort]],
    attributesToHighlight: ['titleBg', 'titleEn'],
    matchingStrategy: query.trim() ? 'all' : 'last',
  })

  return {
    hits:         резултат.hits,
    totalHits:    резултат.totalHits   ?? 0,
    totalPages:   резултат.totalPages  ?? 1,
    page:         резултат.page        ?? page,
    hitsPerPage:  резултат.hitsPerPage ?? НА_СТРАНИЦА,
    processingMs: резултат.processingTimeMs ?? 0,
  }
}
