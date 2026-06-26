import type { Metadata }  from 'next'
import Link               from 'next/link'
import Image              from 'next/image'
import { prisma }         from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const МЕСЕЦИ = [
  'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
  'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември',
]

// ── Metadata ────────────────────────────────────────────────────

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp    = await searchParams
  const сега  = new Date()
  const month = Number(sp.month) || сега.getMonth() + 1
  const year  = Number(sp.year)  || сега.getFullYear()
  const месец = МЕСЕЦИ[month - 1] ?? ''

  return {
    title:       `Общност Top 9 — ${месец} ${year} | MeeplesBG`,
    description: `Разгледай най-играните настолни игри сред общността на MeeplesBG за ${месец} ${year}.`,
    openGraph: {
      title:       `Top 9 за ${месец} ${year} | MeeplesBG`,
      description: `Най-играните настолни игри в MeeplesBG тази ${месец.toLowerCase()}.`,
      locale:      'bg_BG',
      type:        'website',
    },
  }
}

// ── Данни ───────────────────────────────────────────────────────

async function fetchCommunityData(month: number, year: number) {
  // 1. Trending games — colect by appearances and total plays
  const grouped = await prisma.monthlyTop9Entry.groupBy({
    by:    ['gameId'],
    where: { top9: { month, year, isPublic: true } },
    _count: { gameId: true },
    _sum:   { playsCount: true },
    orderBy: { _count: { gameId: 'desc' } },
    take: 9,
  })

  const gameIds = grouped.map((g) => g.gameId)

  // 2. Game details + recent Top 9s + stats — parallel
  const [games, recentTop9s, totalCount] = await Promise.all([
    prisma.game.findMany({
      where:  { id: { in: gameIds } },
      select: { id: true, slug: true, titleBg: true, thumbnailUrl: true },
    }),

    prisma.monthlyTop9.findMany({
      where:   { month, year, isPublic: true, entries: { some: {} } },
      orderBy: { updatedAt: 'desc' },
      take:    12,
      include: {
        user: { select: { id: true, name: true, bggUsername: true, image: true } },
        _count: { select: { entries: true } },
        entries: {
          orderBy: { position: 'asc' },
          take: 3,
          include: { game: { select: { thumbnailUrl: true, titleBg: true } } },
        },
      },
    }),

    prisma.monthlyTop9.count({
      where: { month, year, isPublic: true, entries: { some: {} } },
    }),
  ])

  // Merge groupBy results with game details, preserving order
  const gameMap = new Map(games.map((g) => [g.id, g]))
  const trending = grouped
    .map((g) => ({
      game:        gameMap.get(g.gameId)!,
      appearances: g._count.gameId,
      totalPlays:  g._sum.playsCount ?? 0,
    }))
    .filter((t) => t.game)

  return { trending, recentTop9s, totalCount }
}

// ── Страница ────────────────────────────────────────────────────

export default async function CommunityTop9Page({ searchParams }: { searchParams: SearchParams }) {
  const sp    = await searchParams
  const сега  = new Date()
  const month = Math.min(12, Math.max(1, Number(sp.month) || сега.getMonth() + 1))
  const year  = Math.min(2100, Math.max(2020, Number(sp.year) || сега.getFullYear()))
  const месец = МЕСЕЦИ[month - 1] ?? ''

  const { trending, recentTop9s, totalCount } = await fetchCommunityData(month, year)

  // Month navigation helpers
  function monthUrl(m: number, y: number) {
    return `/top9?month=${m}&year=${y}`
  }
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1  : month + 1
  const nextYear  = month === 12 ? year + 1 : year
  const isFuture  = nextYear > сега.getFullYear() ||
    (nextYear === сега.getFullYear() && nextMonth > сега.getMonth() + 1)

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          🏆 Top 9 на общността
        </h1>
        <p className="text-sm text-gray-500">
          Кои настолни игри играе общността на MeeplesBG?
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={monthUrl(prevMonth, prevYear)}
          className="rounded-xl border border-gray-200 p-2 hover:bg-gray-50 transition-colors text-gray-500"
          aria-label="Предишен месец"
        >
          ←
        </Link>
        <h2 className="text-base font-semibold text-gray-800 min-w-[140px] text-center">
          {месец} {year}
        </h2>
        <Link
          href={isFuture ? '#' : monthUrl(nextMonth, nextYear)}
          className={`rounded-xl border border-gray-200 p-2 transition-colors ${
            isFuture ? 'text-gray-200 pointer-events-none' : 'hover:bg-gray-50 text-gray-500'
          }`}
          aria-label="Следващ месец"
          aria-disabled={isFuture}
        >
          →
        </Link>

        {/* Stats pill */}
        {totalCount > 0 && (
          <span className="ml-auto text-xs bg-brand-50 border border-brand-100 text-brand-700 rounded-full px-3 py-1">
            {totalCount} Top 9 {totalCount === 1 ? 'списък' : 'списъка'}
          </span>
        )}
      </div>

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="py-20 text-center rounded-2xl border-2 border-dashed border-gray-200 mb-10">
          <p className="text-4xl mb-3">🎲</p>
          <h3 className="text-base font-semibold text-gray-700 mb-2">
            Няма публични Top 9 за {месец} {year}
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            Бъди първият, който запазва любимите си игри за този месец!
          </p>
          <Link
            href="/profil?tab=top9"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Създай своя Top 9
          </Link>
        </div>
      )}

      {/* Trending games */}
      {trending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Най-играни игри — {месец} {year}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-9 gap-3">
            {trending.map((t, i) => (
              <Link
                key={t.game.id}
                href={`/igri/${t.game.slug}`}
                className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-brand-400 hover:shadow-md transition-all"
              >
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {t.game.thumbnailUrl ? (
                    <Image
                      src={t.game.thumbnailUrl}
                      alt={t.game.titleBg}
                      fill
                      sizes="(max-width: 768px) 33vw, 120px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-300">🎲</div>
                  )}
                  {/* Rank badge */}
                  <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {i + 1}
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-medium text-gray-800 line-clamp-1">{t.game.titleBg}</p>
                  <p className="text-[10px] text-brand-600 mt-0.5">
                    {t.appearances}× {t.appearances === 1 ? 'списък' : 'списъка'}
                    {t.totalPlays > 0 && ` · ${t.totalPlays} партии`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Top 9s */}
      {recentTop9s.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Последни Top 9 от общността
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recentTop9s.map((t9) => {
              const name = t9.user.bggUsername ?? t9.user.name ?? 'Потребител'
              return (
                <Link
                  key={t9.id}
                  href={`/top9/${t9.shareToken}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-4 hover:border-brand-400 hover:shadow-md transition-all"
                >
                  {/* User info */}
                  <div className="flex items-center gap-2 mb-3">
                    {t9.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t9.user.image}
                        alt={name}
                        width={28}
                        height={28}
                        className="rounded-full border border-gray-200 flex-shrink-0 w-7 h-7 object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 flex-shrink-0">
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
                      <p className="text-[10px] text-gray-400">{t9._count.entries} игри</p>
                    </div>
                    <span className="ml-auto text-[10px] text-brand-600 font-medium group-hover:underline whitespace-nowrap">
                      Виж →
                    </span>
                  </div>

                  {/* 3 game thumbnails */}
                  <div className="flex gap-1.5">
                    {t9.entries.map((e, idx) => (
                      <div key={e.game.titleBg + idx} className="relative flex-1 aspect-square rounded-xl overflow-hidden bg-gray-100">
                        {e.game.thumbnailUrl ? (
                          <Image
                            src={e.game.thumbnailUrl}
                            alt={e.game.titleBg}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-lg text-gray-300">🎲</div>
                        )}
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-gold-500 flex items-center justify-center text-[8px] font-bold text-white">
                          {e.position}
                        </div>
                      </div>
                    ))}
                    {/* Filler if < 3 entries */}
                    {Array.from({ length: Math.max(0, 3 - t9.entries.length) }).map((_, i) => (
                      <div key={`filler-${i}`} className="flex-1 aspect-square rounded-xl bg-gray-50 border border-dashed border-gray-200" />
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="rounded-2xl bg-brand-50 border border-brand-100 p-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Направи своя Top 9 за {месец}
          </h3>
          <p className="text-sm text-gray-500">
            Запази кои игри си играл и сподели с общността.
          </p>
        </div>
        <Link
          href="/profil?tab=top9"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors whitespace-nowrap flex-shrink-0"
        >
          Към моя Top 9 →
        </Link>
      </div>
    </div>
  )
}
