'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export interface MechanikData {
  slug: string
  name: string
  descriptionBg: string | null
  gameCount: number
}

const ГРУПИ_КОНФИГ = [
  {
    икона: '🎴',
    заглавие: 'Карти',
    механики: [
      'Deck, Bag, and Pool Building', 'Deck Construction', 'Hand Management',
      'Card Play Conflict Resolution', 'Multi-Use Cards', 'Open Drafting',
      'Closed Drafting', 'Set Collection', 'Trick-taking', 'Melding and Splaying',
      'Command Cards',
    ],
  },
  {
    икона: '🏗️',
    заглавие: 'Работници и ресурси',
    механики: [
      'Worker Placement', 'Worker Placement, Different Worker Types',
      'Worker Placement with Dice Workers', 'Action Drafting', 'Action Points',
      'Resource Queue', 'Automatic Resource Growth', 'Income', 'Investment',
      'Market', 'Trading', 'Contracts', 'Tech Trees / Tech Tracks',
      'Pick-up and Deliver', 'Delayed Purchase', 'Stock Holding', 'Loans',
      'Commodity Speculation', 'Ownership', 'Increase Value of Unchosen Resources',
    ],
  },
  {
    икона: '🎲',
    заглавие: 'Зарове и случайност',
    механики: [
      'Dice Rolling', 'Push Your Luck', 'Random Production', 'Re-rolling and Locking',
      'Die Icon Resolution', 'Different Dice Movement', 'Critical Hits and Failures',
      'Cube Tower', 'Roll / Spin and Move', 'Chit-Pull System',
    ],
  },
  {
    икона: '⚔️',
    заглавие: 'Конфликт и контрол',
    механики: [
      'Area Majority / Influence', 'Area Movement', 'Area-Impulse', 'Take That',
      'Static Capture', 'Kill Steal', 'Zone of Control', 'Enclosure',
      'Variable Player Powers', 'Campaign / Battle Card Driven',
      'Ratio / Combat Results Table', 'Player Elimination', 'Force Commitment',
      'Tug of War', 'King of the Hill',
    ],
  },
  {
    икона: '🧩',
    заглавие: 'Плочки и мрежи',
    механики: [
      'Tile Placement', 'Pattern Building', 'Pattern Movement', 'Pattern Recognition',
      'Grid Movement', 'Grid Coverage', 'Square Grid', 'Hexagon Grid', 'Connections',
      'Network and Route Building', 'Layering', 'Map Addition', 'Modular Board',
      'Pieces as Map', 'Line Drawing', 'Line of Sight',
    ],
  },
  {
    икона: '🤝',
    заглавие: 'Кооперация',
    механики: [
      'Cooperative Game', 'Semi-Cooperative Game', 'Team-Based Game',
      'Solo / Solitaire Game', 'Traitor Game', 'Hidden Roles',
      'Roles with Asymmetric Information', 'Alliances',
    ],
  },
  {
    икона: '🗺️',
    заглавие: 'Движение и изследване',
    механики: [
      'Point to Point Movement', 'Movement Points', 'Movement Template', 'Race',
      'Track Movement', 'Relative Movement', 'Programmed Movement',
      'Moving Multiple Units', 'Three Dimensional Movement', 'Map Reduction',
      'Map Deformation', 'Multiple Maps', 'Minimap Resolution',
      'Measurement Movement', 'Resource to Move', 'Crayon Rail System',
    ],
  },
  {
    икона: '💰',
    заглавие: 'Наддаване и пазар',
    механики: [
      'Auction / Bidding', 'Auction: Dutch', 'Auction: Dutch Priority',
      'Auction: English', 'Auction: Fixed Placement', 'Auction: Multiple Lot',
      'Auction: Once Around', 'Auction: Sealed Bid', 'Auction: Turn Order Until Pass',
      'Auction Compensation', 'Bids As Wagers', 'Closed Economy Auction',
      'Constrained Bidding', 'Negotiation', 'Predictive Bid', 'Selection Order Bid',
      'Bribery', 'Betting and Bluffing',
    ],
  },
  {
    икона: '🧠',
    заглавие: 'Дедукция и информация',
    механики: [
      'Deduction', 'Hidden Movement', 'Hidden Victory Points', 'Memory',
      'Secret Unit Deployment', 'Communication Limits', 'Targeted Clues',
      'Induction', "Prisoner's Dilemma",
    ],
  },
  {
    икона: '⏱️',
    заглавие: 'Планиране и ред',
    механики: [
      'Simultaneous Action Selection', 'Action / Event', 'Action Queue',
      'Action Retrieval', 'Follow', 'Rondel', 'Order Counters',
      'Turn Order: Auction', 'Turn Order: Claim Action', 'Turn Order: Pass Order',
      'Turn Order: Progressive', 'Turn Order: Random', 'Turn Order: Role Order',
      'Turn Order: Stat-Based', 'Turn Order: Time Track',
      'Variable Phase Order', 'Variable Set-up', 'Chaining', 'Interrupts',
      'Voting', 'Ordering', 'Once-Per-Game Abilities',
    ],
  },
  {
    икона: '📖',
    заглавие: 'Сюжет и ролева',
    механики: [
      'Role Playing', 'Legacy Game', 'Narrative Choice / Paragraph',
      'Storytelling', 'Scenario / Mission / Campaign Game',
    ],
  },
  {
    икона: '🎭',
    заглавие: 'Парти и скоростни',
    механики: [
      'Acting', 'Singing', 'Flicking', 'Stacking and Balancing', 'Real-Time',
      'Action Timer', 'Hot Potato', 'Speed Matching', 'Spelling',
      'Questions and Answers', 'Player Judge', 'Bingo', 'Drawing',
      'Paper-and-Pencil', 'Matching', 'Rock-Paper-Scissors', 'Slide / Push',
      'Elapsed Real Time Ending', 'Physical Removal',
    ],
  },
] as const

const ВСИЧКИ_ГРУПИРАНИ = new Set(ГРУПИ_КОНФИГ.flatMap((г) => [...г.механики]))

function MechanikCard({ м }: { м: MechanikData }) {
  return (
    <Link
      href={`/mehaniki/${м.slug}`}
      className="flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 hover:border-brand-400 hover:shadow-md transition-all duration-200 group"
    >
      <div className="font-semibold text-gray-800 group-hover:text-brand-700 leading-snug mb-2 transition-colors">
        {м.name}
      </div>
      {м.descriptionBg && (
        <div className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-3 flex-1">
          {м.descriptionBg}
        </div>
      )}
      <div className="mt-auto">
        <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
          {м.gameCount} {м.gameCount === 1 ? 'игра' : 'игри'}
        </span>
      </div>
    </Link>
  )
}

export default function MehanikiBrowser({ механики }: { механики: MechanikData[] }) {
  const [търсене, setТърсене] = useState('')

  const механикиМап = useMemo(
    () => new Map(механики.map((м) => [м.name, м])),
    [механики]
  )

  const групи = useMemo(() => {
    const назначени = new Set<string>()
    return ГРУПИ_КОНФИГ
      .map((г) => {
        const членове = г.механики
          .map((name) => механикиМап.get(name))
          .filter((м): м is MechanikData => {
            if (!м || назначени.has(м.name)) return false
            назначени.add(м.name)
            return true
          })
          .sort((a, b) => b.gameCount - a.gameCount)
        return { икона: г.икона, заглавие: г.заглавие, членове }
      })
      .filter((г) => г.членове.length > 0)
  }, [механикиМап])

  const неГрупирани = useMemo(
    () => механики.filter((м) => !ВСИЧКИ_ГРУПИРАНИ.has(м.name as never)),
    [механики]
  )

  const популярни = механики.slice(0, 6)

  const резултати = useMemo(() => {
    if (!търсене.trim()) return null
    const query = търсене.toLowerCase()
    return механики.filter((м) => м.name.toLowerCase().includes(query))
  }, [търсене, механики])

  return (
    <>
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-950 text-white">
        <div className="container mx-auto px-4 py-14 max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Механики в настолните игри
          </h1>
          <p className="text-brand-200 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Разбери как работят различните механики, които правят всяка игра уникална.
            Научи нови термини и открий игри според стила си.
          </p>
          <div className="relative max-w-md mx-auto">
            <input
              type="search"
              placeholder="Търси механика..."
              value={търсене}
              onChange={(e) => setТърсене(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-lg"
              aria-label="Търси механика"
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">

        {!търсене && (
          <>
            {/* SEO текст */}
            <section className="bg-brand-50 border border-brand-100 rounded-2xl p-6 mb-10 text-sm text-gray-700 leading-relaxed">
              <p className="mb-3">
                Всяка настолна игра използва различни <strong>механики</strong> — правила и системи,
                които определят как играчите взаимодействат с играта. Някои игри разчитат на{' '}
                <strong>управление на ресурси</strong>, други на <strong>поставяне на работници</strong>,
                карти, зарове или скрита информация.
              </p>
              <p>
                Разбирането на механиките помага да откриеш нови игри, които отговарят на твоя стил.
                В момента каталогът съдържа <strong>{механики.length} механики</strong>, покриващи{' '}
                над {механики.reduce((s, м) => s + м.gameCount, 0).toLocaleString('bg-BG')} игри.
              </p>
            </section>

            {/* Популярни механики */}
            <section className="mb-10">
              <h2 className="text-lg font-bold text-gray-900 mb-4">🔥 Популярни механики</h2>
              <div className="flex flex-wrap gap-2">
                {популярни.map((м) => (
                  <Link
                    key={м.slug}
                    href={`/mehaniki/${м.slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-200 rounded-full text-sm font-medium text-brand-700 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-colors shadow-sm"
                  >
                    {м.name}
                    <span className="text-xs opacity-70">{м.gameCount}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Групи */}
            <div className="space-y-10">
              {групи.map((г) => (
                <section key={г.заглавие}>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {г.икона} {г.заглавие}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {г.членове.map((м) => (
                      <MechanikCard key={м.slug} м={м} />
                    ))}
                  </div>
                </section>
              ))}

              {/* Негрупирани */}
              {неГрупирани.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Повече механики</h2>
                  <div className="flex flex-wrap gap-2">
                    {неГрупирани.map((м) => (
                      <Link
                        key={м.slug}
                        href={`/mehaniki/${м.slug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                      >
                        {м.name}
                        <span className="text-gray-400">({м.gameCount})</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}

        {/* Резултати от търсенето */}
        {резултати && (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {резултати.length === 0
                ? `Няма намерени механики за „${търсене}"`
                : `${резултати.length} ${резултати.length === 1 ? 'механика' : 'механики'} за „${търсене}"`}
            </p>
            {резултати.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {резултати.map((м) => (
                  <MechanikCard key={м.slug} м={м} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
