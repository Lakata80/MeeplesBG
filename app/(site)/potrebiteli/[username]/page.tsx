import { notFound }      from 'next/navigation'
import Link             from 'next/link'
import Image            from 'next/image'
import type { Metadata } from 'next'
import { auth }          from '@/auth'
import { prisma }        from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = Promise<{ username: string }>

// ── Помощна функция ───────────────────────────────────────────

async function findUser(username: string) {
  return prisma.user.findFirst({
    where: { OR: [
      { bggUsername: { equals: username, mode: 'insensitive' } },
      { id: username },
    ]},
    select: {
      id:          true,
      name:        true,
      image:       true,
      bggUsername: true,
      createdAt:   true,
      _count: { select: { collection: true, reviews: true, threads: true } },
    },
  })
}

// ── SEO ──────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { username } = await params
  const user = await findUser(decodeURIComponent(username))
  if (!user) return { title: 'Потребител не е намерен | MeeplesBG' }
  return {
    title:       `${user.name ?? user.bggUsername ?? 'Потребител'} | MeeplesBG`,
    description: `Разгледай колекцията и активността на ${user.name ?? user.bggUsername ?? 'потребителя'} в MeeplesBG.`,
  }
}

// ── Страница ──────────────────────────────────────────────────

const КАТ_SLUG: Record<string, string> = {
  IZBOR: 'izbor', PRAVILA: 'pravila', PAZAR: 'pazar', SRESHTI: 'sreshti',
}
const КАТ_LABEL: Record<string, string> = {
  IZBOR: 'Помощ при избор', PRAVILA: 'Правила', PAZAR: 'Пазар', SRESHTI: 'Срещи',
}

export default async function ПубличенПрофил({ params }: { params: Params }) {
  const { username }    = await params
  const decoded         = decodeURIComponent(username)
  const [потребител, session] = await Promise.all([findUser(decoded), auth()])

  if (!потребител) notFound()

  const isOwn = session?.user?.id === потребител.id

  // Колекция (OWNS)
  const колекция = await prisma.userCollection.findMany({
    where:   { userId: потребител.id, status: 'OWNS' },
    include: {
      game: {
        select: {
          id: true, slug: true, titleBg: true, titleEn: true,
          thumbnailUrl: true, bggRating: true, yearPublished: true,
          categories: true, minPlaytime: true, maxPlaytime: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Допълнителни статистики
  const [бройPLAYED, бройWISHLIST] = await Promise.all([
    prisma.userCollection.count({ where: { userId: потребител.id, status: 'PLAYED' } }),
    prisma.userCollection.count({ where: { userId: потребител.id, status: 'WISHLIST' } }),
  ])

  // Последни теми в Общността
  const теми = await prisma.thread.findMany({
    where:   { authorId: потребител.id },
    orderBy: { createdAt: 'desc' },
    take:    5,
    select: {
      slug: true, title: true, category: true,
      createdAt: true, _count: { select: { replies: true } },
    },
  })

  // Изчисления
  const категорииБрой = колекция.reduce<Record<string, number>>((acc, { game }) => {
    for (const кат of game.categories) { acc[кат] = (acc[кат] ?? 0) + 1 }
    return acc
  }, {})
  const любимаКатегория = Object.entries(категорииБрой).sort(([, a], [, b]) => b - a)[0]?.[0]
  const общоМинути      = колекция.reduce((с, { game }) => с + (game.maxPlaytime ?? game.minPlaytime ?? 0), 0)
  const общоЧасове      = Math.round(общоМинути / 60)

  const ДАТА = new Intl.DateTimeFormat('bg-BG', { year: 'numeric', month: 'long' })

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">

      {/* Хедър */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-brand-100 flex-shrink-0 border-2 border-gray-200">
          {потребител.image ? (
            <Image src={потребител.image} alt={потребител.name ?? ''} fill className="object-cover" sizes="80px" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-brand-600">
              {(потребител.name ?? потребител.bggUsername ?? '?')[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {потребител.name ?? потребител.bggUsername ?? 'Потребител'}
          </h1>
          {потребител.bggUsername && (
            <a
              href={`https://boardgamegeek.com/user/${потребител.bggUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:underline"
            >
              BoardGameGeek профил ↗
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Член от {ДАТА.format(new Date(потребител.createdAt))}
          </p>
        </div>

        {isOwn && (
          <Link
            href="/profil"
            className="shrink-0 px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ✏️ Редактирай профила
          </Link>
        )}
      </div>

      {/* Статистики */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <СтатКутия стойност={колекция.length} етикет="В колекцията"      икона="🎲" />
        <СтатКутия стойност={бройPLAYED}      етикет="Играни игри"       икона="🕹️" />
        <СтатКутия стойност={бройWISHLIST}    етикет="Искам да играя"    икона="🎯" />
        <СтатКутия стойност={любимаКатегория ?? '—'} етикет="Любим жанр" икона="🏆" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

        {/* Колекция */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Колекция ({колекция.length} {ending(колекция.length)})
          </h2>

          {колекция.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-500 text-sm">Колекцията е празна или непублична.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {колекция.map(({ game, rating }) => (
                <Link
                  key={game.id}
                  href={`/igri/${game.slug}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-brand-400 hover:shadow-md transition-all"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {game.thumbnailUrl ? (
                      <Image
                        src={game.thumbnailUrl}
                        alt={game.titleBg || game.titleEn || ''}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
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

          {общоЧасове > 0 && (
            <p className="mt-4 text-xs text-gray-400">
              * Прогнозни {общоЧасове} часа на база максималното времетраене на игрите.
            </p>
          )}
        </section>

        {/* Sidebar */}
        <aside className="space-y-6">

          {/* Теми в Общността */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">💬 Теми в Общността</h2>
            {теми.length === 0 ? (
              <p className="text-sm text-gray-400">Все още няма публикувани теми.</p>
            ) : (
              <ul className="space-y-2">
                {теми.map((т) => (
                  <li key={т.slug}>
                    <Link
                      href={`/obshtnost/${КАТ_SLUG[т.category]}/${т.slug}`}
                      className="block rounded-xl border border-gray-200 p-3 hover:border-brand-300 transition-colors group"
                    >
                      <p className="text-[11px] font-medium text-gray-400 mb-0.5">
                        {КАТ_LABEL[т.category]}
                      </p>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
                        {т.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {т._count.replies} {т._count.replies === 1 ? 'отговор' : 'отговора'}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Линк към Общността */}
          <Link
            href="/obshtnost"
            className="block text-center text-sm text-brand-600 hover:underline"
          >
            Към Общността →
          </Link>
        </aside>
      </div>
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
  return 'игри'
}
