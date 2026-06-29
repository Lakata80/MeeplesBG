import Image          from 'next/image'
import Link           from 'next/link'
import { Suspense }   from 'react'
import type { Metadata } from 'next'
import { prisma }     from '@/lib/prisma'
import Pagination     from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       'Дневник на общността | MeeplesBG',
  description: 'Виж какво играят другите — публични записи от изиграни партии от общността на MeeplesBG.',
}

const НА_СТРАНИЦА = 20

type SearchParams = Promise<Record<string, string | undefined>>

function formatDate(date: Date) {
  return date.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })
}

function относителноВреме(date: Date): string {
  const сек = Math.floor((Date.now() - date.getTime()) / 1000)
  if (сек < 60)   return 'преди малко'
  if (сек < 3600) return `преди ${Math.floor(сек / 60)} мин.`
  if (сек < 86400) return `преди ${Math.floor(сек / 3600)} ч.`
  const дни = Math.floor(сек / 86400)
  if (дни < 7)   return `преди ${дни} ${дни === 1 ? 'ден' : 'дни'}`
  return formatDate(date)
}

export default async function ИграниятаСтраница({ searchParams }: { searchParams: SearchParams }) {
  const sp       = await searchParams
  const страница = Math.max(1, parseInt(sp.stranica ?? '1') || 1)
  const offset   = (страница - 1) * НА_СТРАНИЦА

  const [играния, общо] = await Promise.all([
    prisma.gamePlay.findMany({
      where:   { visibility: 'PUBLIC' },
      orderBy: { playedAt: 'desc' },
      skip:    offset,
      take:    НА_СТРАНИЦА,
      select: {
        id:              true,
        playedAt:        true,
        durationMinutes: true,
        notes:           true,
        players: {
          orderBy: { score: 'desc' },
          select:  { id: true, name: true, score: true, isWinner: true },
        },
        user: {
          select: { id: true, name: true, image: true },
        },
        game: {
          select: { slug: true, titleBg: true, titleEn: true, thumbnailUrl: true, imageUrl: true },
        },
      },
    }),
    prisma.gamePlay.count({ where: { visibility: 'PUBLIC' } }),
  ])

  const общоСтраници = Math.max(1, Math.ceil(общо / НА_СТРАНИЦА))

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">

      {/* Хедър */}
      <div className="mb-2">
        <Link href="/obshtnost" className="text-sm text-brand-600 hover:text-brand-700 transition-colors">
          ← Общност
        </Link>
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎮 Дневник на общността</h1>
          <p className="text-sm text-gray-500 mt-1">
            Публични играния от членовете на MeeplesBG
            {общо > 0 && <span className="ml-2 text-gray-400">· {общо} записа</span>}
          </p>
        </div>
      </div>

      {/* Лента */}
      {играния.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <div className="text-5xl mb-4">🎲</div>
          <p className="text-lg font-medium text-gray-600 mb-1">Все още няма публични играния</p>
          <p className="text-sm">Бъди първи — запиши игра и я сподели с общността!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {играния.map((play) => {
            const заглавие = play.game.titleBg || play.game.titleEn || 'Непозната игра'
            const снимка   = play.game.thumbnailUrl || play.game.imageUrl
            const победители = play.players.filter((p) => p.isWinner)

            return (
              <article
                key={play.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-brand-200 hover:shadow-sm transition-all"
              >
                <div className="flex gap-4">

                  {/* Снимка на играта */}
                  <Link href={`/igri/${play.game.slug}`} className="shrink-0">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                      {снимка ? (
                        <Image
                          src={снимка}
                          alt={заглавие}
                          fill
                          unoptimized
                          className="object-cover hover:scale-105 transition-transform duration-200"
                          sizes="64px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-300">
                          🎲
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Съдържание */}
                  <div className="flex-1 min-w-0">

                    {/* Горен ред: игра + потребител + дата */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <Link
                          href={`/igri/${play.game.slug}`}
                          className="font-semibold text-gray-900 hover:text-brand-600 transition-colors truncate block text-sm"
                        >
                          {заглавие}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Аватар + потребител */}
                          <div className="flex items-center gap-1.5">
                            <div className="relative w-4 h-4 rounded-full overflow-hidden bg-gray-200 shrink-0">
                              {play.user.image ? (
                                <Image src={play.user.image} alt="" fill className="object-cover" sizes="16px" />
                              ) : (
                                <span className="flex items-center justify-center w-full h-full text-[9px] font-bold text-gray-500">
                                  {(play.user.name ?? '?')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 truncate">
                              {play.user.name ?? 'Потребител'}
                            </span>
                          </div>
                          <span className="text-gray-300 text-xs">·</span>
                          <span className="text-xs text-gray-400">{относителноВреме(play.playedAt)}</span>
                          {play.durationMinutes && (
                            <>
                              <span className="text-gray-300 text-xs">·</span>
                              <span className="text-xs text-gray-400">⏱ {play.durationMinutes} мин.</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Играчи */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {play.players.map((player) => (
                        <span
                          key={player.id}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg ${
                            player.isWinner
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 font-medium'
                              : 'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {player.isWinner && '🏆'}
                          {player.name}
                          {player.score != null && (
                            <span className={player.isWinner ? 'text-amber-500' : 'text-gray-400'}>
                              {player.score} т.
                            </span>
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Бележки */}
                    {play.notes && (
                      <p className="text-xs text-gray-500 italic line-clamp-2">{play.notes}</p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Пагинация */}
      {общоСтраници > 1 && (
        <div className="mt-8">
          <Suspense fallback={null}>
            <Pagination текущаСтраница={страница} общоСтраници={общоСтраници} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
