'use client'

import { useState } from 'react'
import Image     from 'next/image'
import Link      from 'next/link'

export type PCGame = {
  id:           string
  slug:         string
  titleBg:      string
  imageUrl:     string | null
  thumbnailUrl: string | null
  bggRating:    number | null
  yearPublished: number | null
}

export type PCTab = {
  id:          string
  label:       string
  emoji:       string
  games:       PCGame[]
}

export default function PlayerCountTabs({ tabs }: { tabs: PCTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? '')
  const tab = tabs.find((t) => t.id === activeId)

  return (
    <div>
      {/* Pill tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              activeId === t.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white border border-[var(--border)] text-gray-600 hover:border-brand-300 hover:text-brand-700'
            }`}
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Game grid */}
      {tab && (
        tab.games.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
            {tab.games.map((game) => {
              const img = game.imageUrl ?? game.thumbnailUrl
              return (
                <Link
                  key={game.id}
                  href={`/igri/${game.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200 group-hover:ring-brand-300 group-hover:shadow-md transition-all mb-2">
                    {img ? (
                      <Image
                        src={img}
                        alt={game.titleBg}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 17vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-3xl text-gray-200">
                        🎲
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
                    {game.titleBg}
                  </p>
                  {game.bggRating && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      ⭐ {game.bggRating.toFixed(1)}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-10">
            Няма данни за тази категория все още.
          </p>
        )
      )}
    </div>
  )
}
