import { notFound }      from 'next/navigation'
import Image             from 'next/image'
import Link             from 'next/link'
import type { Metadata } from 'next'
import { auth }          from '@/auth'
import { prisma }        from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

// ── Помощна функция — намери потребител по bggUsername или id ──

async function findUser(slug: string) {
  return prisma.user.findFirst({
    where: { OR: [{ bggUsername: slug }, { id: slug }] },
    select: {
      id:          true,
      name:        true,
      image:       true,
      bggUsername: true,
      createdAt:   true,
      _count: {
        select: {
          collection:   true,
          threads:      true,
          threadReplies: true,
        },
      },
    },
  })
}

// ── SEO ───────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const user = await findUser(slug)
  if (!user) return { title: 'Потребител не е намерен | MeeplesBG' }
  return {
    title:       `${user.name ?? 'Потребител'} | MeeplesBG`,
    description: `Разгледай колекцията и активността на ${user.name ?? 'потребителя'} в MeeplesBG.`,
  }
}

// ── Страница ──────────────────────────────────────────────────

export default async function ПубличенПрофил({ params }: { params: Params }) {
  const { slug }  = await params
  const [user, session] = await Promise.all([findUser(slug), auth()])

  if (!user) notFound()

  const isOwn = session?.user?.id === user.id

  // Колекция (само OWNS)
  const колекция = await prisma.userCollection.findMany({
    where:   { userId: user.id, status: 'OWNS' },
    include: {
      game: {
        select: {
          slug: true, titleBg: true, titleEn: true,
          thumbnailUrl: true, bggRating: true, yearPublished: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take:    24,
  })

  // Брой по статус
  const [бройOWNS, бройPLAYED, бройWISHLIST] = await Promise.all([
    prisma.userCollection.count({ where: { userId: user.id, status: 'OWNS' } }),
    prisma.userCollection.count({ where: { userId: user.id, status: 'PLAYED' } }),
    prisma.userCollection.count({ where: { userId: user.id, status: 'WISHLIST' } }),
  ])

  // Последни теми в Общността
  const теми = await prisma.thread.findMany({
    where:   { authorId: user.id },
    orderBy: { createdAt: 'desc' },
    take:    5,
    select: {
      slug: true, title: true, category: true,
      createdAt: true, _count: { select: { replies: true } },
    },
  })

  const КАТ_SLUG: Record<string, string> = {
    IZBOR: 'izbor', PRAVILA: 'pravila', PAZAR: 'pazar', SRESHTI: 'sreshti',
  }
  const КАТ_LABEL: Record<string, string> = {
    IZBOR: 'Помощ при избор', PRAVILA: 'Правила', PAZAR: 'Пазар', SRESHTI: 'Срещи',
  }

  const ДАТА = new Intl.DateTimeFormat('bg-BG', { year: 'numeric', month: 'long' })

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">

      {/* Хедър */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-brand-100 flex-shrink-0">
          {user.image ? (
            <Image src={user.image} alt={user.name ?? ''} fill className="object-cover" sizes="80px" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-brand-600">
              {(user.name ?? '?')[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{user.name ?? 'Потребител'}</h1>
          {user.bggUsername && (
            <a
              href={`https://boardgamegeek.com/user/${user.bggUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:underline"
            >
              BGG: {user.bggUsername}
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Член от {ДАТА.format(new Date(user.createdAt))}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { стойност: бройOWNS,     етикет: 'В колекцията', icon: '🎲' },
          { стойност: бройPLAYED,   етикет: 'Играни',       icon: '🕹️' },
          { стойност: бройWISHLIST, етикет: 'Искам',        icon: '🎯' },
          { стойност: user._count.threads, етикет: 'Теми в Общността', icon: '💬' },
        ].map(({ стойност, етикет, icon }) => (
          <div key={етикет} className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-xl mb-0.5">{icon}</p>
            <p className="text-2xl font-bold text-gray-900">{стойност}</p>
            <p className="text-xs text-gray-500 mt-0.5">{етикет}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

        {/* Колекция */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">🎲 Колекция</h2>
          {колекция.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Колекцията е празна.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {колекция.map(({ game }) => (
                  <Link
                    key={game.slug}
                    href={`/igri/${game.slug}`}
                    className="group rounded-xl border border-gray-200 overflow-hidden hover:border-brand-400 hover:shadow-sm transition-all"
                  >
                    <div className="aspect-square bg-gray-100 relative">
                      {game.thumbnailUrl ? (
                        <Image
                          src={game.thumbnailUrl}
                          alt={game.titleBg}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-300">🎲</div>
                      )}
                      {game.bggRating && (
                        <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1 py-0.5 rounded">
                          {game.bggRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-gray-800 p-1.5 line-clamp-2 leading-tight">
                      {game.titleBg || game.titleEn}
                    </p>
                  </Link>
                ))}
              </div>
              {бройOWNS > 24 && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Показани 24 от {бройOWNS} игри
                </p>
              )}
            </>
          )}
        </section>

        {/* Sidebar — Активност в Общността */}
        <aside>
          <h2 className="text-lg font-bold text-gray-900 mb-4">💬 Теми в Общността</h2>
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
                    <p className="text-xs font-medium text-gray-500 mb-1">
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

          {/* Линк към обща страница */}
          <Link
            href="/obshtnost"
            className="block mt-4 text-center text-sm text-brand-600 hover:underline"
          >
            Към Общността →
          </Link>
        </aside>
      </div>
    </div>
  )
}
