import Image          from 'next/image'
import Link           from 'next/link'
import type { Metadata } from 'next'
import { getHotness }    from '@/lib/bgg/hotness'
import { getActiveWeeklyGame } from '@/lib/sanity/queries'
import { urlFor }        from '@/lib/sanity/image'
import { prisma }        from '@/lib/prisma'
import PlayerCountTabs, { type PCTab } from '@/components/igri/PlayerCountTabs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       'Популярни игри | MeeplesBG',
  description: 'Открий популярни настолни игри — BGG горещ списък, нови заглавия, топ по брой играчи и ръчно избрани скрити находки.',
}

// ── Типове ───────────────────────────────────────────────

type GameRow = {
  id:            string
  slug:          string
  titleBg:       string
  imageUrl:      string | null
  thumbnailUrl:  string | null
  yearPublished: number | null
  bggRating:     number | null
}

const GAME_SELECT = {
  id: true, slug: true, titleBg: true,
  imageUrl: true, thumbnailUrl: true,
  yearPublished: true, bggRating: true,
} as const

// ── Компонент за заглавие на секция ──────────────────────

function SectionTitle({
  title, subtitle, href, hrefLabel = 'Виж всички →',
}: {
  title: string; subtitle?: string; href?: string; hrefLabel?: string
}) {
  return (
    <div className="flex items-start justify-between mb-4 gap-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-sm text-brand-600 hover:text-brand-700 transition-colors shrink-0 mt-0.5">
          {hrefLabel}
        </Link>
      )}
    </div>
  )
}

// ── Карта за хоризонтален ред ─────────────────────────────

function ScrollCard({
  href, imgSrc, title, sub, badge, badgeColor = 'bg-orange-500', unopt = false,
}: {
  href: string
  imgSrc: string | null | undefined
  title: string
  sub?: string | null
  badge?: string | number
  badgeColor?: string
  unopt?: boolean
}) {
  return (
    <Link href={href} className="group shrink-0 w-36 md:w-40">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 group-hover:ring-brand-300 group-hover:shadow-md transition-all mb-2">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            fill
            unoptimized={unopt}
            className={`transition-transform duration-300 group-hover:scale-105 ${unopt ? 'object-contain p-1' : 'object-cover'}`}
            sizes="(max-width: 768px) 144px, 160px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl text-gray-200">🎲</div>
        )}

        {badge !== undefined && (
          <div className={`absolute top-2 left-2 min-w-[26px] h-[26px] px-1.5 flex items-center justify-center rounded-full text-white text-xs font-bold shadow-md ${badgeColor}`}>
            {badge}
          </div>
        )}
      </div>
      <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
        {title}
      </p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </Link>
  )
}

// ── Placeholder секция ────────────────────────────────────

function ComingSoonSection({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <section>
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="relative rounded-2xl border border-dashed border-gray-200 overflow-hidden">
        <div className="flex gap-3 p-4 overflow-hidden pointer-events-none select-none" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 w-32 blur-sm opacity-40">
              <div className="aspect-square bg-gray-200 rounded-xl mb-2" />
              <div className="h-3 bg-gray-200 rounded-md w-3/4 mb-1" />
              <div className="h-2.5 bg-gray-100 rounded-md w-1/2" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)]/75 backdrop-blur-[2px]">
          <span className="text-2xl mb-2">{icon}</span>
          <p className="font-semibold text-gray-700">Очаквайте скоро</p>
          <p className="text-xs text-gray-400 mt-1 text-center max-w-xs px-4">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Главна страница ───────────────────────────────────────

export default async function PopuliarniPage() {

  // Паралелно зареждане на всички данни
  const [
    горещи, weeklyGame, newestGames, hiddenGems,
    soloGames, twoGames, threeToFourGames, fivePlusGames,
  ] = await Promise.all([
    getHotness().catch(() => []),
    getActiveWeeklyGame().catch(() => null),

    // Нови игри
    prisma.game.findMany({
      where:   { isActive: true },
      select:  GAME_SELECT,
      orderBy: { createdAt: 'desc' },
      take:    10,
    }),

    // Скрити находки
    prisma.featuredContent.findMany({
      where:   { type: 'HIDDEN_GEM', isActive: true },
      orderBy: { position: 'asc' },
      include: { game: { select: GAME_SELECT } },
    }).catch(() => []),

    // По брой играчи
    prisma.game.findMany({
      where:   { isActive: true, minPlayers: { lte: 1 }, maxPlayers: { gte: 1 }, bggRating: { not: null } },
      select:  GAME_SELECT,
      orderBy: { bggRating: 'desc' },
      take:    6,
    }),
    prisma.game.findMany({
      where:   { isActive: true, minPlayers: { lte: 2 }, maxPlayers: { gte: 2 }, bggRating: { not: null } },
      select:  GAME_SELECT,
      orderBy: { bggRating: 'desc' },
      take:    6,
    }),
    prisma.game.findMany({
      where:   { isActive: true, minPlayers: { lte: 3 }, maxPlayers: { gte: 4 }, bggRating: { not: null } },
      select:  GAME_SELECT,
      orderBy: { bggRating: 'desc' },
      take:    6,
    }),
    prisma.game.findMany({
      where:   { isActive: true, maxPlayers: { gte: 5 }, bggRating: { not: null } },
      select:  GAME_SELECT,
      orderBy: { bggRating: 'desc' },
      take:    6,
    }),
  ])

  // Обогатяваме BGG hotness с imageUrl и slug от нашата БД
  const bggIds = горещи.map((г) => г.id)
  const dbHotness = bggIds.length > 0
    ? await prisma.game.findMany({
        where:  { bggId: { in: bggIds }, isActive: true },
        select: { bggId: true, slug: true, imageUrl: true, thumbnailUrl: true },
      })
    : []
  const dbMap = new Map(dbHotness.map((г) => [г.bggId, г]))

  // Tabs за компонента по брой играчи
  const playerTabs: PCTab[] = [
    { id: 'solo',       emoji: '🧍',    label: 'Solo',      games: soloGames },
    { id: 'two',        emoji: '👫',    label: 'За двама',  games: twoGames },
    { id: 'three_four', emoji: '🎭',    label: '3–4 души',  games: threeToFourGames },
    { id: 'five_plus',  emoji: '🎉',    label: '5+ души',   games: fivePlusGames },
  ]

  const weeklyBannerUrl = weeklyGame?.bannerImage
    ? urlFor(weeklyGame.bannerImage).width(1600).height(700).fit('crop').url()
    : null

  return (
    <div className="min-h-screen">

      {/* ══════════════════════════════════════════════════
          HERO: Игра на седмицата
      ═══════════════════════════════════════════════════ */}
      {weeklyGame && (
        <section className="relative min-h-[380px] md:min-h-[460px] bg-brand-800 overflow-hidden">
          {weeklyBannerUrl && (
            <Image
              src={weeklyBannerUrl}
              alt={weeklyGame.gameName}
              fill
              priority
              className="object-cover object-center opacity-50"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/75 to-transparent" />

          <div className="relative container mx-auto px-4 py-14 md:py-20 max-w-5xl">
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-gold-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow">
                  🏆 Игра на седмицата
                </span>
                {weeklyGame.weekLabel && (
                  <span className="text-white/50 text-xs">{weeklyGame.weekLabel}</span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-3 drop-shadow">
                {weeklyGame.gameName}
              </h1>

              {weeklyGame.headlineBg && (
                <p className="text-lg text-white/85 mb-4 leading-relaxed">
                  {weeklyGame.headlineBg}
                </p>
              )}

              {weeklyGame.teaserBg && (
                <p className="hidden md:block text-sm text-white/60 mb-6 leading-relaxed">
                  {weeklyGame.teaserBg}
                </p>
              )}

              <div className="flex gap-3 flex-wrap">
                <Link
                  href={`/igri/igra-na-sedmicata/${weeklyGame.slug.current}`}
                  className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg text-sm"
                >
                  Прочети повече
                </Link>
                <Link
                  href={`/igri/${weeklyGame.gameSlug}`}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  Виж играта →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-10 max-w-6xl space-y-12">

        {/* ══════════════════════════════════════════════════
            1. ПОПУЛЯРНИ ТАЗИ СЕДМИЦА (BGG Hotness)
        ═══════════════════════════════════════════════════ */}
        {горещи.length > 0 && (
          <section>
            <SectionTitle
              title="🔥 Популярни тази седмица"
              subtitle={`Топ ${горещи.length} игри според BGG Hotness`}
            />
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {горещи.map((игра, idx) => {
                const db  = dbMap.get(игра.id)
                const href = db?.slug
                  ? `/igri/${db.slug}`
                  : `/igri?q=${encodeURIComponent(игра.name)}`

                // Предпочитаме imageUrl от БД (висока резолюция)
                const hasHighRes = !!db?.imageUrl
                const imgSrc  = db?.imageUrl ?? db?.thumbnailUrl ?? игра.thumbnailUrl

                const badgeColor =
                  idx === 0 ? 'bg-amber-500' :
                  idx === 1 ? 'bg-gray-400'  :
                  idx === 2 ? 'bg-amber-700' :
                              'bg-orange-500'

                return (
                  <Link key={игра.id} href={href} className="group shrink-0 w-36 md:w-40">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 group-hover:ring-brand-300 group-hover:shadow-md transition-all mb-2">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={игра.name}
                          fill
                          unoptimized={!hasHighRes}
                          className={`transition-transform duration-300 group-hover:scale-105 ${hasHighRes ? 'object-cover' : 'object-contain p-1'}`}
                          sizes="(max-width: 768px) 144px, 160px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-3xl text-gray-200">🎲</div>
                      )}

                      {/* Ранк бадж */}
                      <div className={`absolute top-2 left-2 min-w-[26px] h-[26px] px-1.5 flex items-center justify-center rounded-full text-white text-xs font-bold shadow-md ${badgeColor}`}>
                        {idx + 1}
                      </div>

                      {/* Overlay за игри без страница */}
                      {!db?.slug && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-1 backdrop-blur-sm">
                          Скоро в MeeplesBG
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
                      {игра.name}
                    </p>
                    {игра.yearPublished && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{игра.yearPublished}</p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            2. НОВИ В MEEPLESBG
        ═══════════════════════════════════════════════════ */}
        {newestGames.length > 0 && (
          <section>
            <SectionTitle
              title="✨ Нови в MeeplesBG"
              subtitle="Последно добавени игри"
              href="/igri"
              hrefLabel="Всички игри →"
            />
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              {newestGames.map((игра) => (
                <Link key={игра.id} href={`/igri/${игра.slug}`} className="group shrink-0 w-36 md:w-40">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 group-hover:ring-brand-300 group-hover:shadow-md transition-all mb-2">
                    {(игра.imageUrl || игра.thumbnailUrl) ? (
                      <Image
                        src={игра.imageUrl ?? игра.thumbnailUrl!}
                        alt={игра.titleBg}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 144px, 160px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl text-gray-200">🎲</div>
                    )}
                    <div className="absolute top-2 right-2 bg-brand-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow">
                      NEW
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
                    {игра.titleBg}
                  </p>
                  {игра.yearPublished && (
                    <p className="text-[11px] text-gray-400 mt-0.5">{игра.yearPublished}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            3. НАЙ-ДОБРИ ПО БРОЙ ИГРАЧИ
        ═══════════════════════════════════════════════════ */}
        <section>
          <SectionTitle
            title="👥 Най-добри според брой играчи"
            subtitle="Топ избори за всяка компания, наредени по BGG рейтинг"
          />
          <PlayerCountTabs tabs={playerTabs} />
        </section>

        {/* ══════════════════════════════════════════════════
            4. СКРИТИ НАХОДКИ
        ═══════════════════════════════════════════════════ */}
        {hiddenGems.length > 0 && (
          <section>
            <SectionTitle
              title="🔍 Скрити находки"
              subtitle="Ръчно избрани от екипа на MeeplesBG"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {hiddenGems.map(({ id, game }) => (
                <Link
                  key={id}
                  href={`/igri/${game.slug}`}
                  className="group block relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-lg transition-shadow"
                >
                  {(game.imageUrl || game.thumbnailUrl) ? (
                    <Image
                      src={game.imageUrl ?? game.thumbnailUrl!}
                      alt={game.titleBg}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl text-gray-200">🎲</div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3 bg-gold-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-md">
                    🔍 Находка
                  </div>

                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <p className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow">
                      {game.titleBg}
                    </p>
                    {game.yearPublished && (
                      <p className="text-white/60 text-xs mt-0.5">{game.yearPublished}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            5. ПОПУЛЯРНИ СРЕД ПОТРЕБИТЕЛИ — placeholder
        ═══════════════════════════════════════════════════ */}
        <ComingSoonSection
          title="📊 Популярни сред потребители"
          subtitle="Класацията ще се изгражда от гледания, добавяния в колекция и оценки"
          icon="🚀"
        />

        {/* ══════════════════════════════════════════════════
            6. НАЙ-ДОБРЕ ОЦЕНЕНИ — placeholder
        ═══════════════════════════════════════════════════ */}
        <ComingSoonSection
          title="⭐ Най-добре оценени от потребители"
          subtitle="Ще покажем игрите с най-добри оценки от MeeplesBG общността"
          icon="⭐"
        />

      </div>
    </div>
  )
}
