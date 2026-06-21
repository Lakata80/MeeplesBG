import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPlayers, formatPlaytime } from '@/lib/utils'

export default async function NewReleasesSection() {
  const игри = await prisma.game.findMany({
    where: { isActive: true, yearPublished: { not: null } },
    orderBy: { yearPublished: 'desc' },
    take: 10,
    select: {
      slug:          true,
      titleBg:       true,
      titleEn:       true,
      thumbnailUrl:  true,
      imageUrl:      true,
      yearPublished: true,
      minPlayers:    true,
      maxPlayers:    true,
      maxPlaytime:   true,
      bggRating:     true,
      types:         true,
    },
  })

  if (игри.length === 0) return null

  return (
    <section className="py-12 bg-blue-50/40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🚀 Нови издания</h2>
          <Link
            href="/igri?sort=year"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Виж всички →
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
          {игри.map((игра) => {
            const заглавие = игра.titleBg || игра.titleEn || 'Непозната игра'
            const снимка = игра.imageUrl || игра.thumbnailUrl

            return (
              <Link
                key={игра.slug}
                href={`/igri/${игра.slug}`}
                className="flex-shrink-0 w-44 snap-start group"
              >
                <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden mb-3 shadow-sm">
                  {снимка ? (
                    <Image
                      src={снимка}
                      alt={заглавие}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="176px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">
                      🎲
                    </div>
                  )}
                  {игра.yearPublished && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
                      <span className="text-white text-xs font-bold">{игра.yearPublished}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                  {заглавие}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  {игра.bggRating && игра.bggRating > 0 && (
                    <span className="text-xs text-amber-600 font-semibold">
                      ★ {игра.bggRating.toFixed(1)}
                    </span>
                  )}
                  {игра.minPlayers && (
                    <span className="text-xs text-gray-400">
                      {formatPlayers(игра.minPlayers, игра.maxPlayers ?? undefined)}
                    </span>
                  )}
                </div>

                {игра.maxPlaytime && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatPlaytime(игра.maxPlaytime)}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
