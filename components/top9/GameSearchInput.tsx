'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type GameResult = {
  id: string
  titleBg: string
  titleEn: string | null
  thumbnailUrl: string | null
}

export default function GameSearchInput({
  onSelect,
  onCancel,
}: {
  onSelect: (gameId: string) => void
  onCancel: () => void
}) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<GameResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`/api/top9/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  return (
    <div className="rounded-2xl border-2 border-brand-400 bg-white shadow-lg overflow-hidden">
      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <span className="text-gray-400 text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Търси игра от колекцията..."
          className="flex-1 text-sm focus:outline-none placeholder:text-gray-400"
        />
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-sm px-1 transition-colors"
          aria-label="Затвори"
        >
          ✕
        </button>
      </div>

      {/* Results */}
      <div className="max-h-60 overflow-y-auto">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-6">Търсене...</p>
        ) : results.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">
            {query.trim() ? 'Няма намерени игри в колекцията' : 'Въведи име на игра'}
          </p>
        ) : (
          <ul>
            {results.map((game) => (
              <li key={game.id}>
                <button
                  onClick={() => onSelect(game.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-brand-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 relative overflow-hidden">
                    {game.thumbnailUrl ? (
                      <Image src={game.thumbnailUrl} alt="" fill sizes="32px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-base">🎲</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-800 truncate">{game.titleBg}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
