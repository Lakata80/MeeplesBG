import type { Metadata } from 'next'
import { searchGames, type SearchResult } from '@/lib/search/queries'
import type { GameCardProps } from '@/components/games/GameCard'
import GameGrid           from '@/components/games/GameGrid'
import SearchFilters      from '@/components/search/SearchFilters'
import SortSelect         from '@/components/search/SortSelect'
import Pagination         from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'

// ── Тип за searchParams в Next.js 16 ──────────
type SearchParamsType = Promise<Record<string, string | string[] | undefined>>

// ── Помощни функции ────────────────────────────

function getString(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val
}

function getInt(val: string | string[] | undefined): number | undefined {
  const s = getString(val)
  if (!s) return undefined
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function getFloat(val: string | string[] | undefined): number | undefined {
  const s = getString(val)
  if (!s) return undefined
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function getSort(val: string | string[] | undefined): 'rating' | 'year' | 'name' {
  const s = getString(val)
  if (s === 'year' || s === 'name') return s
  return 'rating'
}

// ── SEO метаданни ──────────────────────────────

export async function generateMetadata({ searchParams }: { searchParams: SearchParamsType }): Promise<Metadata> {
  const парам = await searchParams
  const q = getString(парам.q)?.trim()

  return q
    ? {
        title:       `Резултати за "${q}" | MeeplesBG`,
        description: `Намери настолни игри за "${q}" в базата на MeeplesBG.`,
      }
    : {
        title:       'Всички игри | MeeplesBG',
        description: 'Разгледай над 2 000 настолни игри. Филтрирай по брой играчи, тип, времетраене и сложност.',
      }
}

// ── Форматиране на заглавие с резултати ────────

function заглавиеРезултати(q: string, общо: number): string {
  if (общо === 0) return 'Няма намерени игри'
  if (q) return `Резултати за „${q}" (${общо} ${общо === 1 ? 'игра' : 'игри'})`
  return `Намерени ${общо} ${общо === 1 ? 'игра' : 'игри'}`
}

// ── Главна страница ────────────────────────────

export default async function ИгриСтраница({ searchParams }: { searchParams: SearchParamsType }) {
  const парам = await searchParams

  // Парсване на URL параметри
  const q         = getString(парам.q)?.trim() ?? ''
  const играчи    = getInt(парам.igrali)
  const вреМакс   = getInt(парам.vreme)
  const минВъзраст = getInt(парам.vozrast)
  const типове    = getString(парам.tip)?.split(',').filter(Boolean)
  const maxWeight = getFloat(парам.slozhnost)
  const подредба  = getSort(парам.podredba)
  const страница  = Math.max(1, getInt(парам.stranica) ?? 1)

  // MeiliSearch заявка
  const EMPTY: SearchResult = { hits: [], totalHits: 0, totalPages: 1, page: 1, hitsPerPage: 20, processingMs: 0 }

  const резултати = await searchGames({
    query:       q,
    players:     играчи,
    maxPlaytime: вреМакс,
    minAge:      минВъзраст,
    maxWeight,
    types:       типове,
    sort:        подредба,
    page:        страница,
  }).catch(() => EMPTY)

  // Конвертирай hits в GameCard пропс
  const карти: GameCardProps[] = резултати.hits.map((х) => ({
    slug:          х.slug,
    titleBg:       х.titleBg,
    titleEn:       х.titleEn ?? undefined,
    thumbnailUrl:  х.thumbnailUrl ?? undefined,
    imageUrl:      х.imageUrl ?? undefined,
    yearPublished: х.yearPublished ?? undefined,
    minPlayers:    х.minPlayers ?? undefined,
    maxPlayers:    х.maxPlayers ?? undefined,
    maxPlaytime:   х.maxPlaytime ?? undefined,
    minAge:        х.minAge ?? undefined,
    bggRating:     х.bggRating ?? undefined,
    weight:        х.weight ?? undefined,
    types:         х.types ?? [],
  }))

  const безРезултати = карти.length === 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">

        {/* Филтри */}
        <SearchFilters />

        {/* Резултати */}
        <div className="flex-1 min-w-0">
          {/* Заглавие + наредба */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {заглавиеРезултати(q, резултати.totalHits)}
              </h1>
              {резултати.processingMs > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  намерено за {резултати.processingMs} мс
                </p>
              )}
            </div>
            {!безРезултати && <SortSelect />}
          </div>

          {/* Резултати */}
          {безРезултати ? (
            <div className="py-20 text-center text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-medium text-gray-600 mb-2">
                Няма намерени игри
              </p>
              <p className="text-sm">
                {q
                  ? `Не намерихме игри за „${q}". Опитай с различни думи или премахни някои филтри.`
                  : 'Опитай с различни филтри.'}
              </p>
            </div>
          ) : (
            <>
              <GameGrid игри={карти} колони={4} />

              <Pagination
                текущаСтраница={резултати.page}
                общоСтраници={резултати.totalPages}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
