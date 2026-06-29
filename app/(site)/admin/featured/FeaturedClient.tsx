'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link  from 'next/link'

interface GameOption {
  id:           string
  slug:         string
  titleBg:      string
  titleEn:      string | null
  imageUrl:     string | null
  thumbnailUrl: string | null
  yearPublished: number | null
  bggRating:    number | null
}

interface FeaturedGem {
  id:       string
  position: number
  game:     GameOption
}

const MAX_GEMS = 4

export default function AdminFeaturedPage() {
  const [gems,    setGems]    = useState<FeaturedGem[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId,  setBusyId]  = useState<string | null>(null)
  const [search,  setSearch]  = useState('')
  const [results, setResults] = useState<GameOption[]>([])
  const [searching, setSearching] = useState(false)
  const [addError,  setAddError]  = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function loadGems() {
    const res = await fetch('/api/admin/featured')
    if (res.ok) setGems(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadGems() }, [])

  // Debounced търсене
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!search.trim()) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/admin/featured?search=${encodeURIComponent(search)}`)
      if (res.ok) setResults(await res.json())
      setSearching(false)
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  async function addGem(game: GameOption) {
    setAddError(null)
    setBusyId(game.id)
    const res = await fetch('/api/admin/featured', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ gameId: game.id, type: 'HIDDEN_GEM' }),
    })
    if (res.ok) {
      setSearch('')
      setResults([])
      await loadGems()
    } else {
      const data = await res.json().catch(() => ({}))
      setAddError(data.грешка ?? 'Грешка при добавяне.')
    }
    setBusyId(null)
  }

  async function removeGem(id: string) {
    setBusyId(id)
    await fetch(`/api/admin/featured/${id}`, { method: 'DELETE' })
    await loadGems()
    setBusyId(null)
  }

  const gemIds = new Set(gems.map((г) => г.game.id))
  const filteredResults = results.filter((r) => !gemIds.has(r.id))

  if (loading) {
    return <div className="container mx-auto px-4 py-12 text-gray-400">Зареждане...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Хлебни трохи */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-brand-600 transition-colors">
          ← Администрация
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-brand-800 mb-1">Препоръчани секции</h1>
      <p className="text-sm text-gray-400 mb-8">Управление на ръчно избрано съдържание</p>

      {/* ── Секция 1: Игра на седмицата ─────────────────────── */}
      <section className="bg-white border border-[var(--border)] rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🏆</span>
          <div className="flex-1">
            <h2 className="font-semibold text-brand-800 text-lg mb-1">Игра на седмицата</h2>
            <p className="text-sm text-gray-500 mb-4">
              Управлява се чрез Sanity Studio. Създай нов запис от тип{' '}
              <strong>„Игра на седмицата"</strong>, попълни банер снимка и текст,
              след което активирай записа.
            </p>
            <div className="flex gap-3">
              <a
                href="/studio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                Отвори Sanity Studio →
              </a>
              <Link
                href="/igri/populiarni"
                target="_blank"
                className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-xl border border-gray-200 transition-colors"
              >
                Виж страницата
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Секция 2: Скрити находки ─────────────────────────── */}
      <section className="bg-white border border-[var(--border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-brand-800 text-lg flex items-center gap-2">
            🔍 Скрити находки
          </h2>
          <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
            gems.length >= MAX_GEMS
              ? 'bg-orange-100 text-orange-600'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {gems.length} / {MAX_GEMS}
          </span>
        </div>
        <p className="text-sm text-gray-400 mb-5">
          Точно 4 игри, избрани ръчно — показват се на страницата „Популярни".
        </p>

        {/* Текущи находки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {gems.map((gem) => (
            <div
              key={gem.id}
              className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3"
            >
              {/* Снимка */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                {(gem.game.thumbnailUrl || gem.game.imageUrl) ? (
                  <Image
                    src={gem.game.thumbnailUrl ?? gem.game.imageUrl!}
                    alt={gem.game.titleBg}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xl">🎲</div>
                )}
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/igri/${gem.game.slug}`}
                  target="_blank"
                  className="font-medium text-brand-700 hover:underline text-sm truncate block"
                >
                  {gem.game.titleBg}
                </Link>
                <p className="text-xs text-gray-400">
                  {gem.game.yearPublished ?? ''}
                  {gem.game.bggRating ? ` · ⭐ ${gem.game.bggRating.toFixed(1)}` : ''}
                </p>
              </div>

              {/* Премахни */}
              <button
                disabled={busyId === gem.id}
                onClick={() => removeGem(gem.id)}
                title="Премахни"
                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1.5 transition-colors disabled:opacity-40 shrink-0"
              >
                {busyId === gem.id ? (
                  <span className="text-xs">...</span>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          ))}

          {/* Празни слотове */}
          {Array.from({ length: MAX_GEMS - gems.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center h-[72px] border-2 border-dashed border-gray-200 rounded-xl text-gray-300 text-sm"
            >
              Празен слот
            </div>
          ))}
        </div>

        {/* Търсене за добавяне */}
        {gems.length < MAX_GEMS && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Добави игра
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Търси по заглавие…"
                className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              {searching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs">
                  ⟳
                </span>
              )}
            </div>

            {addError && (
              <p className="text-xs text-red-500 mt-1.5">{addError}</p>
            )}

            {/* Резултати от търсене */}
            {filteredResults.length > 0 && (
              <ul className="mt-2 border border-[var(--border)] rounded-xl overflow-hidden bg-white shadow-sm">
                {filteredResults.map((game) => (
                  <li key={game.id} className="border-b border-gray-50 last:border-0">
                    <button
                      disabled={busyId === game.id}
                      onClick={() => addGem(game)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-brand-50 transition-colors text-left disabled:opacity-50"
                    >
                      <div className="relative w-8 h-8 rounded-md overflow-hidden bg-gray-100 shrink-0">
                        {(game.thumbnailUrl || game.imageUrl) ? (
                          <Image
                            src={game.thumbnailUrl ?? game.imageUrl!}
                            alt={game.titleBg}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-gray-300">🎲</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 text-sm block truncate">
                          {game.titleBg}
                        </span>
                        {game.titleEn && (
                          <span className="text-xs text-gray-400 truncate block">{game.titleEn}</span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-brand-600 shrink-0">
                        {busyId === game.id ? '...' : '+ Добави'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {search.trim() && !searching && filteredResults.length === 0 && (
              <p className="text-sm text-gray-400 mt-2 text-center py-2">
                Няма намерени игри.
              </p>
            )}
          </div>
        )}

        {gems.length >= MAX_GEMS && (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            Достигнат е максимумът от {MAX_GEMS} находки. Премахни една, за да добавиш нова.
          </p>
        )}
      </section>
    </div>
  )
}
