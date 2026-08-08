import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import GameGrid from '@/components/games/GameGrid'
import type { GameCardProps } from '@/components/games/GameCard'

export const revalidate = 3600

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const механика = await prisma.mechanic.findUnique({ where: { slug } })
  if (!механика) return { title: 'Механика не е намерена | MeeplesBG' }
  return {
    title: `${механика.name} | Механики | MeeplesBG`,
    description: `Игри с механиката ${механика.name} в MeeplesBG`,
  }
}

export default async function МеханикаСтраница({ params }: { params: Params }) {
  const { slug } = await params
  const механика = await prisma.mechanic.findUnique({ where: { slug } })
  if (!механика) notFound()

  const игри = await prisma.game.findMany({
    where:   { isActive: true, mechanics: { has: механика.name }, baseGameId: null },
    orderBy: [
      { bggRank:   { sort: 'asc',  nulls: 'last' } },
      { bggRating: { sort: 'desc', nulls: 'last' } },
    ],
    take:    24,
    select: {
      slug: true, titleBg: true, titleEn: true,
      thumbnailUrl: true, imageUrl: true,
      yearPublished: true, bggRating: true,
      minPlayers: true, maxPlayers: true,
      maxPlaytime: true, minAge: true,
      weight: true, types: true,
    },
  })

  const карти: GameCardProps[] = игри.map((г) => ({
    slug:          г.slug,
    titleBg:       г.titleBg,
    titleEn:       г.titleEn,
    thumbnailUrl:  г.thumbnailUrl,
    imageUrl:      г.imageUrl,
    yearPublished: г.yearPublished,
    bggRating:     г.bggRating,
    minPlayers:    г.minPlayers,
    maxPlayers:    г.maxPlayers,
    maxPlaytime:   г.maxPlaytime,
    minAge:        г.minAge,
    weight:        г.weight,
    types:         г.types,
  }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">

      {/* Breadcrumb */}
      <nav aria-label="Навигационна пътека" className="mb-6">
        <ol className="flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <li><Link href="/" className="hover:text-brand-600 transition-colors">Начало</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/mehaniki" className="hover:text-brand-600 transition-colors">Механики</Link></li>
          <li aria-hidden>/</li>
          <li className="text-gray-900 font-medium">{механика.name}</li>
        </ol>
      </nav>

      {/* Заглавие */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-800 mb-1">{механика.name}</h1>
        <span className="text-xs text-gray-400 font-mono">механика</span>
      </div>

      {/* Описание */}
      {механика.descriptionBg && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-10">
          <p className="text-gray-700 leading-relaxed">{механика.descriptionBg}</p>
        </div>
      )}

      {/* Игри с тази механика */}
      {карти.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-brand-800 mb-4">
            Топ игри с тази механика
            <span className="ml-2 text-sm font-normal text-gray-400">({игри.length})</span>
          </h2>
          <GameGrid игри={карти} колони={4} />
        </section>
      )}
    </div>
  )
}
