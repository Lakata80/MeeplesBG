import type { Metadata }  from 'next'
import Link               from 'next/link'
import { prisma }         from '@/lib/prisma'
import GameCard           from '@/components/games/GameCard'
import KvizForm           from '@/components/games/KvizForm'
import type { KvizDefaults } from '@/components/games/KvizForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       'Намери своята игра | MeeplesBG',
  description: 'Отговори на 5 въпроса и ние ще ти препоръчаме най-подходящите настолни игри.',
}

type SearchParams = Promise<Record<string, string | undefined>>

// ── Типове ───────────────────────────────────────────────────

type GameRow = {
  id: string; slug: string; titleBg: string; titleEn: string | null
  thumbnailUrl: string | null; imageUrl: string | null; yearPublished: number | null
  minPlayers: number | null; maxPlayers: number | null
  minPlaytime: number | null; maxPlaytime: number | null
  minAge: number | null; weight: number | null; bggRating: number | null
  types: string[]
}

type KvizParams = {
  players?:    number
  time?:       string
  complexity?: string
  types?:      string[]
  age?:        number
}

// ── Scoring алгоритъм ─────────────────────────────────────────

function scoreGame(g: GameRow, p: KvizParams): number {
  let score = 0

  // Играчи (30 т)
  if (p.players !== undefined) {
    const n = p.players
    if (n === 5) {
      if (g.maxPlayers !== null && g.maxPlayers >= 5) score += 30
    } else if (n === 1) {
      if (g.minPlayers !== null && g.minPlayers <= 1) score += 30
      else score -= 20
    } else {
      if (g.minPlayers !== null && g.maxPlayers !== null
          && g.minPlayers <= n && g.maxPlayers >= n) {
        score += 30
      } else if (g.maxPlayers !== null && g.maxPlayers < n) {
        score -= 20
      }
    }
  }

  // Времетраене (25 т)
  if (p.time) {
    if (p.time === 'long') {
      if (g.minPlaytime !== null && g.minPlaytime >= 180)           score += 25
      else if (g.maxPlaytime !== null && g.maxPlaytime >= 150)      score += 12
      else if (g.maxPlaytime !== null && g.maxPlaytime < 60)        score -= 15
    } else {
      const maxT = parseInt(p.time)
      if (g.maxPlaytime !== null) {
        if (g.maxPlaytime <= maxT)                                    score += 25
        else if (g.maxPlaytime <= maxT * 1.5)                        score += 10
        else if (g.minPlaytime !== null && g.minPlaytime > maxT * 2) score -= 15
      }
    }
  }

  // Сложност (20 т)
  if (p.complexity && g.weight !== null) {
    const w = g.weight
    if (p.complexity === 'easy') {
      if (w <= 2.0)      score += 20
      else if (w <= 2.5)  score += 10
      else if (w > 3.5)   score -= 10
    } else if (p.complexity === 'medium') {
      if (w > 2.0 && w <= 3.5)  score += 20
      else if (w >= 1.5)          score += 8
    } else if (p.complexity === 'hard') {
      if (w > 3.5)       score += 20
      else if (w > 3.0)   score += 10
      else if (w < 2.0)   score -= 10
    }
  }

  // Тип игра (15 т)
  if (p.types && p.types.length > 0 && g.types.length > 0) {
    const matched = p.types.filter(t => g.types.includes(t)).length
    score += Math.min(15, matched * 8)
  }

  // Възраст (10 т)
  if (p.age !== undefined && g.minAge !== null) {
    if (p.age === 16) {
      if (g.minAge >= 14) score += 5
    } else {
      if (g.minAge <= p.age)          score += 10
      else if (g.minAge <= p.age + 2) score += 4
      else if (g.minAge > p.age + 4)  score -= 8
    }
  }

  // Бонус BGG рейтинг (до 5 т)
  if (g.bggRating !== null && g.bggRating > 0) {
    score += (g.bggRating / 10) * 5
  }

  return score
}

// ── Mapping към /igri URL ─────────────────────────────────────
// /igri ползва: igrali, vreme (30|60|120|240), slozhnost (float), tip, vozrast

function buildIgriUrl(p: KvizParams): string {
  const q = new URLSearchParams()

  if (p.players !== undefined)
    q.set('igrali', String(p.players))

  if (p.time) {
    const vremeMap: Record<string, string> = {
      '30': '30', '60': '60', '90': '120', '120': '120', 'long': '240',
    }
    const v = vremeMap[p.time]
    if (v) q.set('vreme', v)
  }

  if (p.complexity) {
    if (p.complexity === 'easy')   q.set('slozhnost', '2')
    if (p.complexity === 'medium') q.set('slozhnost', '3.5')
    // 'hard' → no upper-weight filter exists in /igri
  }

  if (p.types && p.types.length > 0)
    q.set('tip', p.types.join(','))

  if (p.age !== undefined)
    q.set('vozrast', String(p.age))

  const qs = q.toString()
  return qs ? `/igri?${qs}` : '/igri'
}

// ── DB заявка с pre-filter ────────────────────────────────────

async function queryGames(p: KvizParams): Promise<GameRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { isActive: true }

  if (p.players !== undefined) {
    if (p.players === 5) {
      where.maxPlayers = { gte: 5 }
    } else if (p.players === 1) {
      where.minPlayers = { lte: 1 }
    } else {
      where.minPlayers = { lte: p.players }
      where.maxPlayers = { gte: p.players }
    }
  }

  if (p.time) {
    if (p.time === 'long') {
      where.minPlaytime = { gte: 120 }
    } else {
      const maxT = parseInt(p.time)
      where.maxPlaytime = { lte: maxT * 2 }
    }
  }

  return prisma.game.findMany({
    where,
    orderBy: { bggRating: 'desc' },
    take:    300,
    select: {
      id: true, slug: true, titleBg: true, titleEn: true,
      thumbnailUrl: true, imageUrl: true, yearPublished: true,
      minPlayers: true, maxPlayers: true,
      minPlaytime: true, maxPlaytime: true,
      minAge: true, weight: true, bggRating: true, types: true,
    },
  })
}

// ── Страница ──────────────────────────────────────────────────

export default async function КуизСтраница({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams

  const playersRaw    = sp.players
  const timeRaw       = sp.time
  const complexityRaw = sp.complexity
  const typesRaw      = sp.types
  const ageRaw        = sp.age

  const params: KvizParams = {}
  if (playersRaw)    params.players    = parseInt(playersRaw)
  if (timeRaw)       params.time       = timeRaw
  if (complexityRaw) params.complexity = complexityRaw
  if (typesRaw)      params.types      = typesRaw.split(',').filter(Boolean)
  if (ageRaw)        params.age        = parseInt(ageRaw)

  const defaults: KvizDefaults = {
    players:    playersRaw,
    time:       timeRaw,
    complexity: complexityRaw,
    types:      typesRaw?.split(',').filter(Boolean),
    age:        ageRaw,
  }

  const hasParams = !!(playersRaw || timeRaw || complexityRaw || typesRaw || ageRaw)

  const страница = Math.max(1, parseInt(sp.stranica ?? '1') || 1)
  const РЕЗУЛТАТИ_НА_СТРАНИЦА = 9

  let pageResults:  (GameRow & { score: number })[] = []
  let hasMore = false

  if (hasParams) {
    const games = await queryGames(params)
    const allScored = games
      .map(g => ({ ...g, score: scoreGame(g, params) }))
      .filter(g => g.score > 0)
      .sort((a, b) => b.score - a.score)

    const from = (страница - 1) * РЕЗУЛТАТИ_НА_СТРАНИЦА
    const to   = страница * РЕЗУЛТАТИ_НА_СТРАНИЦА
    pageResults = allScored.slice(from, to)
    hasMore     = allScored.length > to
  }

  const igriUrl = buildIgriUrl(params)

  // URL за "Намери още" — запазва всички текущи параметри + stranica+1
  function buildMoreUrl(): string {
    const p = new URLSearchParams()
    if (playersRaw)    p.set('players',    playersRaw)
    if (timeRaw)       p.set('time',       timeRaw)
    if (complexityRaw) p.set('complexity', complexityRaw)
    if (typesRaw)      p.set('types',      typesRaw)
    if (ageRaw)        p.set('age',        ageRaw)
    p.set('stranica', String(страница + 1))
    return `/igri/kviz?${p.toString()}#rezultati`
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">

      {/* Хлебни трохи */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/obshtnost" className="hover:text-brand-600">Общност</Link>
        <span>›</span>
        <Link href="/obshtnost?kat=izbor" className="hover:text-brand-600">Помощ при избор</Link>
        <span>›</span>
        <span className="text-gray-700">Намери своята игра</span>
      </nav>

      {/* Заглавие */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎲 Намери своята игра</h1>
        <p className="text-gray-500 text-sm">
          Отговори на въпросите по-долу и ние ще препоръчаме игри, подходящи точно за теб.
          Всички полета са по избор.
        </p>
      </div>

      {/* Форма */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 shadow-sm">
        <KvizForm defaults={defaults} />
      </div>

      {/* Резултати */}
      {hasParams && (
        <div id="rezultati">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              {pageResults.length > 0
                ? страница === 1
                  ? 'Препоръки за теб'
                  : `Още игри (стр. ${страница})`
                : 'Не намерихме съвпадения'}
            </h2>
            {pageResults.length > 0 && (
              <Link
                href={igriUrl}
                className="text-sm text-brand-600 hover:underline font-medium"
              >
                Разгледай всички подобни игри →
              </Link>
            )}
          </div>

          {pageResults.length === 0 ? (
            <div className="py-12 text-center bg-white border border-gray-200 rounded-2xl">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-600 font-medium mb-1">Опитай с по-широки критерии</p>
              <p className="text-sm text-gray-400">
                Например, пропусни филтъра за брой играчи или смени сложността.
              </p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {pageResults.map((g) => (
                <GameCard
                  key={g.id}
                  slug={g.slug}
                  titleBg={g.titleBg}
                  titleEn={g.titleEn}
                  thumbnailUrl={g.thumbnailUrl}
                  imageUrl={g.imageUrl}
                  yearPublished={g.yearPublished}
                  minPlayers={g.minPlayers}
                  maxPlayers={g.maxPlayers}
                  maxPlaytime={g.maxPlaytime}
                  minAge={g.minAge}
                  bggRating={g.bggRating}
                  weight={g.weight}
                  types={g.types}
                />
              ))}
            </div>

            {/* Намери още / няма повече */}
            <div className="mt-8 flex flex-col items-center gap-2">
              {hasMore ? (
                <Link
                  href={buildMoreUrl()}
                  className="px-8 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors shadow-sm text-sm"
                >
                  🎲 Намери още игри
                </Link>
              ) : (
                <p className="text-sm text-gray-400">Няма повече подобни игри.</p>
              )}
              <Link href={igriUrl} className="text-xs text-brand-600 hover:underline mt-1">
                Виж всички подобни игри в каталога →
              </Link>
            </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
