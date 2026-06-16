import type { Metadata }   from 'next'
import { notFound }        from 'next/navigation'
import Link                from 'next/link'
import Image               from 'next/image'
import { prisma }          from '@/lib/prisma'

// ── Типове ────────────────────────────────────────────────────

type Params = Promise<{ username: string }>

// ── SEO ──────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${decodeURIComponent(username)} — Профил`,
    description: `Разгледай колекцията от настолни игри на ${decodeURIComponent(username)} в MeeplesBG.`,
  }
}

// ── Страница ──────────────────────────────────────────────────

export default async function ПубличенПрофил({ params }: { params: Params }) {
  const { username } = await params
  const bggUsername  = decodeURIComponent(username)

  const потребител = await prisma.user.findFirst({
    where:  { bggUsername: { equals: bggUsername, mode: 'insensitive' } },
    select: {
      id:          true,
      name:        true,
      image:       true,
      bggUsername: true,
      createdAt:   true,
      _count: { select: { collection: true, reviews: true } },
    },
  })

  if (!потребител) notFound()

  // Вземи само OWNS игрите за публичния профил
  const колекция = await prisma.userCollection.findMany({
    where:   { userId: потребител.id, status: 'OWNS' },
    include: {
      game: {
        select: {
          id:           true,
          slug:         true,
          titleBg:      true,
          titleEn:      true,
          thumbnailUrl: true,
          bggRating:    true,
          yearPublished: true,
          categories:   true,
          types:        true,
          minPlaytime:  true,
          maxPlaytime:  true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // ── Статистики ────────────────────────────────────────────
  const категорииБрой = колекция.reduce<Record<string, number>>((acc, { game }) => {
    for (const кат of game.categories) {
      acc[кат] = (acc[кат] ?? 0) + 1
    }
    return acc
  }, {})
  const любимаКатегория = Object.entries(категорииБрой)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  const общоМинути = колекция.reduce((сума, { game }) => {
    return сума + (game.maxPlaytime ?? game.minPlaytime ?? 0)
  }, 0)
  const общоЧасове = Math.round(общоМинути / 60)

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">

      {/* Профил хедър */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
        {потребител.image ? (
          <Image
            src={потребител.image}
            alt={потребител.name ?? 'Аватар'}
            width={80}
            height={80}
            className="rounded-full border-2 border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 flex-shrink-0">
            {(потребител.name ?? потребител.bggUsername ?? '?')[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {потребител.name ?? потребител.bggUsername}
          </h1>
          {потребител.bggUsername && (
            <a
              href={`https://boardgamegeek.com/user/${потребител.bggUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              BoardGameGeek профил ↗
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Член от {new Date(потребител.createdAt).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Статистики */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <СтатКутия стойност={колекция.length}   етикет="Игри в колекцията" икона="🎲" />
        <СтатКутия стойност={общоЧасове}         етикет="Общо играни часове*" икона="⏱️" />
        <СтатКутия стойност={потребител._count.reviews} етикет="Ревюта" икона="✍️" />
        <СтатКутия стойност={любимаКатегория ?? '—'} етикет="Любим жанр" икона="🏆" />
      </div>

      {/* Колекция */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Колекция ({колекция.length} {ending(колекция.length)})
        </h2>
      </div>

      {колекция.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 text-sm">Колекцията е празна или непублична.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {колекция.map(({ game, rating }) => (
            <Link
              key={game.id}
              href={`/игри/${game.slug}`}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {game.thumbnailUrl ? (
                  <Image
                    src={game.thumbnailUrl}
                    alt={game.titleBg || game.titleEn || ''}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl text-gray-300">🎲</div>
                )}
                {game.bggRating && (
                  <span className="absolute top-1.5 right-1.5 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg">
                    {game.bggRating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="p-2.5 flex-1 flex flex-col">
                <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight flex-1">
                  {game.titleBg || game.titleEn}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  {game.yearPublished && <span className="text-[10px] text-gray-400">{game.yearPublished}</span>}
                  {rating && <span className="text-[10px] text-yellow-600 font-medium">★ {rating}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-400">
        * Общо играни часове се изчислява на база максималното времетраене на всяка игра в колекцията.
      </p>
    </div>
  )
}

// ── Помощни компоненти ────────────────────────────────────────

function СтатКутия({ стойност, етикет, икона }: { стойност: number | string; етикет: string; икона: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
      <p className="text-xl mb-1">{икона}</p>
      <p className="text-xl font-bold text-gray-900">{стойност}</p>
      <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{етикет}</p>
    </div>
  )
}

function ending(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'игра'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'игри'
  return 'игри'
}
