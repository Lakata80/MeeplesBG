import GameCard, { type GameCardProps } from './GameCard'

interface Props {
  игри: GameCardProps[]
  колони?: 2 | 3 | 4 | 5
}

export default function GameGrid({ игри, колони = 4 }: Props) {
  if (игри.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        <p className="text-4xl mb-3">🎲</p>
        <p className="text-sm">Все още няма игри тук</p>
      </div>
    )
  }

  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  }[колони]

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {игри.map((игра) => (
        <GameCard key={игра.slug} {...игра} />
      ))}
    </div>
  )
}
