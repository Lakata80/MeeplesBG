import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { cache } from 'react'
import type { Metadata } from 'next'
import { CollectionStatus } from '@prisma/client'

import { prisma }            from '@/lib/prisma'
import { auth }              from '@/auth'
import { formatPlaytime, formatPlayers, formatRating } from '@/lib/utils'
import CollectionButtons     from '@/components/game/CollectionButtons'
import ShareButton           from '@/components/game/ShareButton'
import DescriptionSection    from '@/components/game/DescriptionSection'
import GallerySection        from '@/components/game/GallerySection'
import YouTubeSection        from '@/components/game/YouTubeSection'
import CommentsSection       from '@/components/game/CommentsSection'
import GameGrid              from '@/components/games/GameGrid'
import type { GameCardProps } from '@/components/games/GameCard'

// ── Кеширана функция — предотвратява двойно зареждане ───
const getGame = cache(async (slug: string) => {
  return prisma.game.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, bggId: true,
      titleBg: true, titleEn: true,
      descriptionBg: true, descriptionEn: true,
      yearPublished: true,
      minPlayers: true, maxPlayers: true,
      minPlaytime: true, maxPlaytime: true,
      minAge: true, weight: true,
      bggRating: true, ourRating: true,
      imageUrl: true, thumbnailUrl: true,
      categories: true, mechanics: true, types: true,
      isActive: true,
      _count: { select: { comments: { where: { isApproved: true } } } },
    },
  })
})

export const dynamic = 'force-dynamic'

// ── SEO метаданни ──────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const игра = await getGame(slug)
  if (!игра) return { title: 'Играта не беше намерена | MeeplesBG' }

  const заглавие = игра.titleBg || игра.titleEn || 'Непозната игра'
  const описание = (игра.descriptionBg || игра.descriptionEn || '').slice(0, 160)

  return {
    title: `${заглавие} | MeeplesBG`,
    description: описание || `${заглавие} — настолна игра. Виж ревюта, правила и цени в MeeplesBG.`,
    openGraph: {
      title:  заглавие,
      description: описание,
      images: игра.imageUrl ? [{ url: игра.imageUrl, alt: заглавие }] : [],
      type:   'website',
      locale: 'bg_BG',
    },
  }
}

// ── Помощни компоненти ──────────────────────────────────

function Breadcrumb({ заглавие }: { заглавие: string }) {
  return (
    <nav aria-label="Навигационна пътека" className="border-b border-gray-100 py-3">
      <div className="container mx-auto px-4 max-w-5xl">
        <ol className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <li><Link href="/" className="hover:text-blue-600 transition-colors">Начало</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/игри" className="hover:text-blue-600 transition-colors">Игри</Link></li>
          <li aria-hidden>/</li>
          <li className="text-gray-900 font-medium truncate max-w-48">{заглавие}</li>
        </ol>
      </div>
    </nav>
  )
}

function MetaCard({ икона, заглавие, стойност }: { икона: string; заглавие: string; стойност: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-xl mb-1">{икона}</div>
      <div className="text-xs text-gray-500 mb-0.5">{заглавие}</div>
      <div className="text-sm font-semibold text-gray-900">{стойност}</div>
    </div>
  )
}

function RatingBar({ заглавие, стойност, максимум = 10, цвят = 'blue' }: {
  заглавие: string
  стойност: number
  максимум?: number
  цвят?: 'blue' | 'amber'
}) {
  const процент = Math.min((стойност / максимум) * 100, 100)
  const барКлас = цвят === 'amber' ? 'bg-amber-500' : 'bg-blue-600'

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600">{заглавие}</span>
        <span className="text-sm font-bold text-gray-900">{formatRating(стойност)}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${барКлас} rounded-full`} style={{ width: `${процент}%` }} />
      </div>
    </div>
  )
}

function PlaytimeSection({ минPlaytime, максPlaytime, минPlayeri, максPlayeri }: {
  минPlaytime?: number | null
  максPlaytime?: number | null
  минPlayeri?: number | null
  максPlayeri?: number | null
}) {
  if (!минPlaytime || !максPlaytime || !минPlayeri || !максPlayeri) return null

  const играчи = [1, 2, 3, 4].filter((н) => н >= минPlayeri! && н <= максPlayeri!)
  if (играчи.length === 0) return null

  const диапазон = максPlaytime - минPlaytime

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⏱ Времетраене по брой играчи</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {играчи.map((н) => {
            const минути = Math.round(минPlaytime + диапазон / 4 * (н - 1))
            return (
              <div key={н} className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {formatPlaytime(минути)}
                </div>
                <div className="text-xs text-gray-500">
                  {н === 1 ? '1 играч' : `${н} играча`}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Разширения — отделна async функция, обвита в Suspense
async function ExpansionsSection({ gameId }: { gameId: string }) {
  const разширения = await prisma.game.findMany({
    where:   { baseGameId: gameId, isActive: true },
    orderBy: { yearPublished: 'asc' },
    select:  {
      slug: true, titleBg: true, titleEn: true,
      thumbnailUrl: true, imageUrl: true,
      yearPublished: true, bggRating: true, types: true,
    },
    take: 12,
  })

  if (разширения.length === 0) return null

  const карти: GameCardProps[] = разширения.map((р) => ({
    slug: р.slug, titleBg: р.titleBg, titleEn: р.titleEn,
    thumbnailUrl: р.thumbnailUrl, imageUrl: р.imageUrl,
    yearPublished: р.yearPublished, bggRating: р.bggRating, types: р.types,
  }))

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📦 Разширения</h2>
        <GameGrid игри={карти} колони={4} />
      </div>
    </section>
  )
}

// Общностна статистика
async function CommunityStats({ gameId }: { gameId: string }) {
  const [собственици, искатЯ, играли] = await Promise.all([
    prisma.userCollection.count({ where: { gameId, status: 'OWNS' } }),
    prisma.userCollection.count({ where: { gameId, status: 'WISHLIST' } }),
    prisma.userCollection.count({ where: { gameId, status: 'PLAYED' } }),
  ])

  const данни = [
    { икона: '📦', брой: собственици, надпис: 'Собственици' },
    { икона: '⭐', брой: искатЯ,     надпис: 'Искат я' },
    { икона: '✅', брой: играли,      надпис: 'Играли' },
  ]

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Общностна статистика</h2>
        <div className="grid grid-cols-3 gap-4">
          {данни.map(({ икона, брой, надпис }) => (
            <div key={надпис} className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{икона}</div>
              <div className="text-2xl font-bold text-gray-900">{брой}</div>
              <div className="text-xs text-gray-500 mt-0.5">{надпис}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Подобни игри
async function SimilarGamesSection({ игра }: {
  игра: { id: string; types: string[]; categories: string[] }
}) {
  const подобни = await prisma.game.findMany({
    where: {
      id:       { not: игра.id },
      isActive: true,
      OR: [
        { types:      { hasSome: игра.types } },
        { categories: { hasSome: игра.categories } },
      ],
    },
    orderBy: [{ bggRating: { sort: 'desc', nulls: 'last' } }],
    take:    4,
    select:  {
      slug: true, titleBg: true, titleEn: true,
      thumbnailUrl: true, imageUrl: true,
      yearPublished: true, bggRating: true,
      minPlayers: true, maxPlayers: true,
      maxPlaytime: true, minAge: true,
      weight: true, types: true,
    },
  })

  if (подобни.length === 0) return null

  const карти: GameCardProps[] = подобни.map((п) => ({
    slug: п.slug, titleBg: п.titleBg, titleEn: п.titleEn,
    thumbnailUrl: п.thumbnailUrl, imageUrl: п.imageUrl,
    yearPublished: п.yearPublished, bggRating: п.bggRating,
    minPlayers: п.minPlayers, maxPlayers: п.maxPlayers,
    maxPlaytime: п.maxPlaytime, minAge: п.minAge,
    weight: п.weight, types: п.types,
  }))

  return (
    <section className="py-8 border-t border-gray-100 bg-gray-50/50">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 Подобни игри</h2>
        <GameGrid игри={карти} колони={4} />
      </div>
    </section>
  )
}

// Schema.org JSON-LD
function BoardGameSchema({ игра, заглавие }: {
  игра: NonNullable<Awaited<ReturnType<typeof getGame>>>
  заглавие: string
}) {
  const schema = {
    '@context':     'https://schema.org',
    '@type':        'BoardGame',
    name:           заглавие,
    description:    (игра.descriptionBg || игра.descriptionEn || '').slice(0, 500) || undefined,
    image:          игра.imageUrl || undefined,
    datePublished:  игра.yearPublished ? String(игра.yearPublished) : undefined,
    numberOfPlayers: (игра.minPlayers && игра.maxPlayers)
      ? `${игра.minPlayers}-${игра.maxPlayers}`
      : undefined,
    timeRequired:   игра.maxPlaytime ? `PT${игра.maxPlaytime}M` : undefined,
    genre:          [...игра.types, ...игра.categories],
    gamePlatform:   'Настолна игра',
    ...(игра.bggRating && {
      aggregateRating: {
        '@type':       'AggregateRating',
        ratingValue:   игра.bggRating.toFixed(1),
        bestRating:    '10',
        worstRating:   '1',
        ratingCount:   игра._count.comments + 1,
      },
    }),
    url: `https://meeplesbg.com/игри/${игра.slug}`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ── Главна страница ────────────────────────────────────
export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const игра = await getGame(slug)

  // Ако не е намерена по slug, провери по bggId
  if (!игра) {
    const bggId = parseInt(slug, 10)
    if (!isNaN(bggId)) {
      const поBggId = await prisma.game.findUnique({
        where:  { bggId },
        select: { slug: true },
      })
      if (поBggId) redirect(`/игри/${поBggId.slug}`)
    }
    notFound()
  }

  const заглавие = игра.titleBg || игра.titleEn || 'Непозната игра'

  // Сесия и статус в колекцията
  const сесия = await auth()
  let колекцияСтатус: CollectionStatus | null = null
  if (сесия?.user?.id) {
    const запис = await prisma.userCollection.findUnique({
      where:  { userId_gameId: { userId: сесия.user.id, gameId: игра.id } },
      select: { status: true },
    })
    колекцияСтатус = запис?.status ?? null
  }

  // Тагове (типове + механики)
  const тагове = [...игра.types, ...игра.mechanics.slice(0, 6)]

  // Сложност (weight) в текст
  function сложностТекст(w: number): string {
    if (w < 1.5) return 'Лесна'
    if (w < 2.5) return 'Умерена'
    if (w < 3.5) return 'Средна'
    if (w < 4.5) return 'Трудна'
    return 'Много трудна'
  }

  return (
    <>
      <BoardGameSchema игра={игра} заглавие={заглавие} />

      <Breadcrumb заглавие={заглавие} />

      {/* ── Hero секция ── */}
      <section className="py-8 border-b border-gray-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Снимка */}
            <div className="flex-shrink-0 flex flex-col items-center gap-3">
              <div className="relative w-48 h-48 bg-gray-100 rounded-2xl overflow-hidden shadow-md">
                {игра.imageUrl ? (
                  <Image
                    src={игра.imageUrl}
                    alt={заглавие}
                    fill
                    className="object-cover"
                    priority
                    sizes="192px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-5xl text-gray-200">
                    🎲
                  </div>
                )}
              </div>
              {игра.bggId && (
                <a
                  href={`https://boardgamegeek.com/boardgame/${игра.bggId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                >
                  BGG #{игра.bggId}
                </a>
              )}
            </div>

            {/* Информация */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-1">
                {заглавие}
              </h1>
              {игра.titleEn && игра.titleBg && (
                <p className="text-sm text-gray-400 mb-2">{игра.titleEn}</p>
              )}
              {игра.yearPublished && (
                <p className="text-sm text-gray-500 mb-3">{игра.yearPublished}</p>
              )}

              {/* Тагове */}
              {тагове.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {тагове.map((таг) => (
                    <span
                      key={таг}
                      className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-medium"
                    >
                      {таг}
                    </span>
                  ))}
                </div>
              )}

              {/* Мета решетка */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <MetaCard
                  икона="👥"
                  заглавие="Играчи"
                  стойност={formatPlayers(игра.minPlayers ?? undefined, игра.maxPlayers ?? undefined)}
                />
                <MetaCard
                  икона="⏱"
                  заглавие="Времетраене"
                  стойност={
                    игра.maxPlaytime
                      ? (игра.minPlaytime && игра.minPlaytime !== игра.maxPlaytime
                          ? `${игра.minPlaytime}–${игра.maxPlaytime}м`
                          : formatPlaytime(игра.maxPlaytime))
                      : 'Неизвестно'
                  }
                />
                <MetaCard
                  икона="🎂"
                  заглавие="Минимална възраст"
                  стойност={игра.minAge ? `${игра.minAge}+` : 'Без ограничение'}
                />
                <MetaCard
                  икона="🧠"
                  заглавие="Сложност"
                  стойност={игра.weight ? сложностТекст(игра.weight) : 'Неизвестно'}
                />
              </div>

              {/* Рейтинги */}
              <div className="space-y-2 mb-5 max-w-sm">
                {игра.bggRating && игра.bggRating > 0 && (
                  <RatingBar заглавие="BGG рейтинг" стойност={игра.bggRating} цвят="blue" />
                )}
                {игра.ourRating && игра.ourRating > 0 && (
                  <RatingBar заглавие="Наш рейтинг" стойност={игра.ourRating} цвят="amber" />
                )}
              </div>

              {/* Бутони за колекция */}
              <div className="flex flex-wrap gap-2 mb-3">
                <CollectionButtons
                  gameId={игра.id}
                  slug={игра.slug}
                  текущСтатус={колекцияСтатус}
                  влязъл={!!сесия?.user}
                />
              </div>

              {/* Сподели */}
              <div className="flex gap-2">
                <ShareButton заглавие={заглавие} slug={игра.slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Времетраене по играчи ── */}
      <PlaytimeSection
        минPlaytime={игра.minPlaytime}
        максPlaytime={игра.maxPlaytime}
        минPlayeri={игра.minPlayers}
        максPlayeri={игра.maxPlayers}
      />

      {/* ── Описание ── */}
      <DescriptionSection
        descriptionBg={игра.descriptionBg}
        descriptionEn={игра.descriptionEn}
      />

      {/* ── Галерия ── */}
      <GallerySection
        imageUrl={игра.imageUrl}
        thumbnailUrl={игра.thumbnailUrl}
        заглавие={заглавие}
      />

      {/* ── YouTube видео уроци ── */}
      <Suspense fallback={null}>
        <YouTubeSection заглавие={игра.titleEn || заглавие} />
      </Suspense>

      {/* ── Разширения ── */}
      <Suspense fallback={null}>
        <ExpansionsSection gameId={игра.id} />
      </Suspense>

      {/* ── Магазинни цени (placeholder) ── */}
      <section className="py-8 border-t border-gray-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-xl font-bold text-gray-900 mb-3">🛒 Цени в магазини</h2>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center text-sm text-blue-600">
            <p className="font-medium mb-1">Скоро — цени от български магазини</p>
            <p className="text-blue-400 text-xs">
              Работим по интеграция с онлайн магазините. Очаквайте!
            </p>
          </div>
        </div>
      </section>

      {/* ── Общностна статистика ── */}
      <Suspense fallback={null}>
        <CommunityStats gameId={игра.id} />
      </Suspense>

      {/* ── Коментари ── */}
      <Suspense fallback={
        <div className="py-8 border-t border-gray-100">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <CommentsSection gameId={игра.id} slug={игра.slug} влязъл={!!сесия?.user} />
      </Suspense>

      {/* ── Подобни игри ── */}
      <Suspense fallback={null}>
        <SimilarGamesSection игра={{ id: игра.id, types: игра.types, categories: игра.categories }} />
      </Suspense>
    </>
  )
}
