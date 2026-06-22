import Image from 'next/image'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { fetchBGGHotness } from '@/lib/bgg/client'
import { prisma } from '@/lib/prisma'
import type { BggHotnessItem } from '@/lib/bgg/types'

const getHotness = unstable_cache(
  () => fetchBGGHotness(),
  ['bgg-hotness'],
  { revalidate: 21600 }
)

export default async function HotnessSection() {
  let горещи: BggHotnessItem[] = []

  try {
    горещи = await getHotness()
  } catch {
    return null
  }

  if (горещи.length === 0) return null

  const топ = горещи.slice(0, 10)

  // Намери slug-ове за игрите, които имаме в базата
  const bggIds = топ.map((и) => и.id)
  const dbИгри = await prisma.game.findMany({
    where: { bggId: { in: bggIds }, isActive: true },
    select: { bggId: true, slug: true },
  })
  const slugMap = new Map(dbИгри.map((и) => [и.bggId, и.slug]))

  return (
    <section className="py-12 bg-orange-50/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🔥 Горещо в момента</h2>
          <Link href="/igri" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
            Виж всички →
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
          {топ.map((игра, индекс) => {
            const slug = slugMap.get(игра.id)
            const href = slug
              ? `/igri/${slug}`
              : `/igri?q=${encodeURIComponent(игра.name)}`

            return (
              <Link
                key={игра.id}
                href={href}
                className="flex-shrink-0 w-32 snap-start group"
              >
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2 shadow-sm">
                  {игра.thumbnailUrl ? (
                    <Image
                      src={игра.thumbnailUrl}
                      alt={игра.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="128px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">
                      🎲
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5 w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                    {индекс + 1}
                  </div>
                </div>
                <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-brand-600 transition-colors leading-tight">
                  {игра.name}
                </p>
                {игра.yearPublished && (
                  <p className="text-xs text-gray-400 mt-0.5">{игра.yearPublished}</p>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
