import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function HiddenGemsTeaser() {
  let находки: Awaited<ReturnType<typeof fetchGems>> = []
  try {
    находки = await fetchGems()
  } catch {
    return null
  }

  if (находки.length === 0) return null

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">🔍 Скрити находки</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ръчно избрани от екипа на MeeplesBG</p>
          </div>
          <Link href="/igri/populiarni" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
            Виж всички →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {находки.map(({ id, game }) => (
            <Link
              key={id}
              href={`/igri/${game.slug}`}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-lg transition-shadow"
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

              <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-md">
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
      </div>
    </section>
  )
}

async function fetchGems() {
  return prisma.featuredContent.findMany({
    where:   { type: 'HIDDEN_GEM', isActive: true },
    orderBy: { position: 'asc' },
    take:    4,
    include: {
      game: {
        select: {
          slug:          true,
          titleBg:       true,
          imageUrl:      true,
          thumbnailUrl:  true,
          yearPublished: true,
        },
      },
    },
  })
}
