import type { Metadata }   from 'next'
import { redirect }        from 'next/navigation'
import Link                from 'next/link'
import Image               from 'next/image'
import { auth }            from '@/auth'
import { prisma }          from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Моят профил',
}

// ── Типове ────────────────────────────────────────────────────

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type Таб = 'колекция' | 'искам' | 'играл' | 'активност'

const ТАБОВЕ: { id: Таб; label: string; status?: string }[] = [
  { id: 'колекция',  label: '🎲 Колекция',          status: 'OWNS' },
  { id: 'искам',     label: '🎯 Искам да играя',     status: 'WISHLIST' },
  { id: 'играл',     label: '🕹️ Играл съм',          status: 'PLAYED' },
  { id: 'активност', label: '📊 Активност' },
]

// ── Страница ──────────────────────────────────────────────────

export default async function ПрофилСтраница({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const парам    = await searchParams
  const активен  = (typeof парам.tab === 'string' ? парам.tab : 'колекция') as Таб
  const таб      = ТАБОВЕ.find((t) => t.id === активен) ?? ТАБОВЕ[0]

  const потребител = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: {
      id:          true,
      name:        true,
      email:       true,
      image:       true,
      bggUsername: true,
      createdAt:   true,
      _count: {
        select: { collection: true, reviews: true },
      },
    },
  })
  if (!потребител) redirect('/login')

  // Вземи игри за активния таб
  const игри = таб.status
    ? await prisma.userCollection.findMany({
        where:   { userId: потребител.id, status: таб.status as 'OWNS' | 'WISHLIST' | 'PLAYED' | 'FORSALE' },
        include: { game: { select: { id: true, slug: true, titleBg: true, titleEn: true, thumbnailUrl: true, bggRating: true, yearPublished: true } } },
        orderBy: { createdAt: 'desc' },
        take:    200,
      })
    : []

  // Активност — последни добавени
  const последниДобавени = !таб.status
    ? await prisma.userCollection.findMany({
        where:   { userId: потребител.id },
        include: { game: { select: { slug: true, titleBg: true, titleEn: true, thumbnailUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
    : []

  function tabUrl(id: Таб) {
    return id === 'колекция' ? '/profil' : `/profil?tab=${id}`
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">

      {/* Профил хедър */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
        {потребител.image ? (
          <Image
            src={потребител.image}
            alt={потребител.name ?? 'Аватар'}
            width={72}
            height={72}
            className="rounded-full border-2 border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 flex-shrink-0">
            {(потребител.name ?? потребител.email ?? '?')[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">
            {потребител.name ?? потребител.email ?? 'Потребител'}
          </h1>
          {потребител.bggUsername && (
            <a
              href={`https://boardgamegeek.com/user/${потребител.bggUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              BGG: {потребител.bggUsername}
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Член от {new Date(потребител.createdAt).toLocaleDateString('bg-BG', { year: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/profil/bgg-import"
            className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>🔄</span>
            <span>{потребител.bggUsername ? 'Синхронизирай с BGG' : 'Импортирай от BGG'}</span>
          </Link>
        </div>
      </div>

      {/* Статистики */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { стойност: потребител._count.collection, етикет: 'Игри в колекцията' },
          { стойност: потребител._count.reviews,    етикет: 'Ревюта' },
          { стойност: '-', етикет: 'Играни часове (скоро)' },
        ].map(({ стойност, етикет }) => (
          <div key={етикет} className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{стойност}</p>
            <p className="text-xs text-gray-500 mt-1">{етикет}</p>
          </div>
        ))}
      </div>

      {/* Публичен профил линк */}
      {потребител.bggUsername && (
        <div className="mb-6 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-blue-800">
            Публичен профил:{' '}
            <Link href={`/potrebiteli/${потребител.bggUsername}`} className="font-medium hover:underline">
              meeplesbg.com/potrebiteli/{потребител.bggUsername}
            </Link>
          </p>
          <Link
            href={`/potrebiteli/${потребител.bggUsername}`}
            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
          >
            Прегледай →
          </Link>
        </div>
      )}

      {/* Табове */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {ТАБОВЕ.map((t) => (
          <Link
            key={t.id}
            href={tabUrl(t.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              t.id === активен
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Съдържание на таба */}
      {таб.id === 'активност' ? (
        <АктивностТаб последни={последниДобавени} />
      ) : игри.length === 0 ? (
        <ПразноСъстояние таб={таб.id} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {игри.map(({ game, rating, playCount }) => (
            <КартичкаИгра
              key={game.id}
              slug={game.slug}
              заглавие={game.titleBg || game.titleEn || ''}
              снимка={game.thumbnailUrl}
              рейтинг={game.bggRating}
              година={game.yearPublished}
              личенРейтинг={rating}
              изиграванияБрой={playCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Подкомпоненти ─────────────────────────────────────────────

function КартичкаИгра({
  slug,
  заглавие,
  снимка,
  рейтинг,
  година,
  личенРейтинг,
  изиграванияБрой,
}: {
  slug:             string
  заглавие:         string
  снимка?:          string | null
  рейтинг?:         number | null
  година?:          number | null
  личенРейтинг?:    number | null
  изиграванияБрой:  number
}) {
  return (
    <Link href={`/игри/${slug}`} className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-blue-400 hover:shadow-md transition-all">
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {снимка ? (
          <Image
            src={снимка}
            alt={заглавие}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl text-gray-300">🎲</div>
        )}
        {рейтинг && (
          <span className="absolute top-1.5 right-1.5 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded-lg">
            {рейтинг.toFixed(1)}
          </span>
        )}
      </div>
      <div className="p-2.5 flex-1 flex flex-col">
        <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight flex-1">{заглавие}</p>
        <div className="flex items-center justify-between mt-1.5">
          {година && <span className="text-[10px] text-gray-400">{година}</span>}
          {изиграванияБрой > 0 && (
            <span className="text-[10px] text-blue-600 font-medium">{изиграванияБрой}× изигр.</span>
          )}
          {личенРейтинг && (
            <span className="text-[10px] text-yellow-600 font-medium">★ {личенРейтинг}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function АктивностТаб({ последни }: { последни: { game: { slug: string; titleBg: string; titleEn: string | null; thumbnailUrl: string | null }; createdAt: Date }[] }) {
  if (последни.length === 0) {
    return (
      <div className="py-16 text-center text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-sm">Все още няма активност. Импортирай колекцията си от BGG!</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Последно добавени игри</h2>
      {последни.map(({ game, createdAt }) => (
        <Link key={game.slug} href={`/игри/${game.slug}`} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 hover:border-blue-300 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
            {game.thumbnailUrl ? (
              <Image src={game.thumbnailUrl} alt="" fill className="object-cover" sizes="40px" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-lg">🎲</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{game.titleBg || game.titleEn}</p>
            <p className="text-xs text-gray-400">
              Добавено на {new Date(createdAt).toLocaleDateString('bg-BG')}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ПразноСъстояние({ таб }: { таб: Таб }) {
  const съобщения: Record<Таб, { текст: string; икона: string }> = {
    колекция:  { икона: '🎲', текст: 'Все още нямаш игри в колекцията. Импортирай от BGG или добави ръчно!' },
    искам:     { икона: '🎯', текст: 'Нямаш игри в списъка "Искам да играя". Добави такива от страниците на игрите!' },
    играл:     { икона: '🕹️', текст: 'Не сме записали игри, с които си играл. Синхронизирай от BGG!' },
    активност: { икона: '📊', текст: 'Все още няма активност.' },
  }
  const { икона, текст } = съобщения[таб]
  return (
    <div className="py-16 text-center">
      <p className="text-5xl mb-4">{икона}</p>
      <p className="text-gray-500 text-sm max-w-sm mx-auto mb-5">{текст}</p>
      <Link
        href="/profil/bgg-import"
        className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
      >
        Импортирай от BGG
      </Link>
    </div>
  )
}
