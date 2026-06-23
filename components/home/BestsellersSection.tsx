import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import GameGrid from '@/components/games/GameGrid'
import type { GameCardProps } from '@/components/games/GameCard'

export default async function BestsellersSection() {
  const игри = await prisma.game.findMany({
    where: { isActive: true },
    orderBy: [
      { ourRating: { sort: 'desc', nulls: 'last' } },
      { bggRating: { sort: 'desc', nulls: 'last' } },
    ],
    take: 8,
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
      minAge:        true,
      bggRating:     true,
      weight:        true,
      types:         true,
    },
  })

  if (игри.length === 0) return null

  const карти: GameCardProps[] = игри.map((и) => ({
    slug:          и.slug,
    titleBg:       и.titleBg,
    titleEn:       и.titleEn,
    thumbnailUrl:  и.thumbnailUrl,
    imageUrl:      и.imageUrl,
    yearPublished: и.yearPublished,
    minPlayers:    и.minPlayers,
    maxPlayers:    и.maxPlayers,
    maxPlaytime:   и.maxPlaytime,
    minAge:        и.minAge,
    bggRating:     и.bggRating,
    weight:        и.weight,
    types:         и.types,
  }))

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-brand-800">🏆 Най-добри игри</h2>
          <Link href="/top" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
            Топ 100 →
          </Link>
        </div>

        <GameGrid игри={карти} колони={4} />
      </div>
    </section>
  )
}
