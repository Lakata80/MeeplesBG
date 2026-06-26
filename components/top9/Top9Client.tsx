'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import SortableSlot, { type SlotEntry } from './SortableSlot'
import GameSearchInput from './GameSearchInput'

type Top9 = {
  id:                string
  month:             number
  year:              number
  isPublic:          boolean
  shareToken:        string
  generatedImageUrl: string | null
  entries:           SlotEntry[]
}

const МЕСЕЦИ = [
  'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
  'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември',
]

export default function Top9Client() {
  const сега = new Date()

  const [month, setMonth]         = useState(сега.getMonth() + 1)
  const [year, setYear]           = useState(сега.getFullYear())
  const [top9, setTop9]           = useState<Top9 | null | undefined>(undefined) // undefined = loading
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [showSearch, setShowSearch]       = useState(false)
  const [copied, setCopied]               = useState(false)
  const [generating, setGenerating]       = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [showHistory, setShowHistory]     = useState(false)
  const [history, setHistory]             = useState<Top9[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // ── Fetch ─────────────────────────────────────────────────────

  const fetchTop9 = useCallback(async () => {
    setTop9(undefined) // loading
    setError(null)
    setShowSearch(false)
    try {
      const res  = await fetch(`/api/top9?month=${month}&year=${year}`)
      const data = await res.json()
      setTop9(data ?? null)
    } catch {
      setError('Грешка при зареждане. Опитай отново.')
      setTop9(null)
    }
  }, [month, year])

  useEffect(() => { fetchTop9() }, [fetchTop9])

  // ── Create ────────────────────────────────────────────────────

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch('/api/top9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTop9(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка при създаване')
    } finally {
      setSaving(false)
    }
  }

  // ── Add game ──────────────────────────────────────────────────

  async function handleAddGame(gameId: string) {
    if (!top9) return
    setSaving(true)
    setError(null)
    try {
      const res  = await fetch(`/api/top9/${top9.id}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTop9((prev) => prev ? { ...prev, entries: [...prev.entries, data] } : null)
      setShowSearch(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка при добавяне')
    } finally {
      setSaving(false)
    }
  }

  // ── Remove game ───────────────────────────────────────────────

  async function handleRemove(entryId: string) {
    if (!top9) return
    const remaining = top9.entries
      .filter((e) => e.id !== entryId)
      .sort((a, b) => a.position - b.position)
      .map((e, i) => ({ ...e, position: i + 1 }))

    setTop9((prev) => prev ? { ...prev, entries: remaining } : null)
    setSaving(true)
    setError(null)

    try {
      const delRes = await fetch(`/api/top9/${top9.id}/entries/${entryId}`, { method: 'DELETE' })
      if (!delRes.ok) throw new Error()

      if (remaining.length > 0) {
        await fetch(`/api/top9/${top9.id}/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entries: remaining.map((e) => ({ entryId: e.id, position: e.position })),
          }),
        })
      }
    } catch {
      setError('Грешка при премахване')
      fetchTop9()
    } finally {
      setSaving(false)
    }
  }

  // ── Update plays ──────────────────────────────────────────────

  async function handleUpdatePlays(entryId: string, playsCount: number | null) {
    if (!top9) return
    setTop9((prev) =>
      prev ? { ...prev, entries: prev.entries.map((e) => e.id === entryId ? { ...e, playsCount } : e) } : null
    )
    try {
      const res = await fetch(`/api/top9/${top9.id}/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playsCount }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setError('Грешка при запазване на партии')
      fetchTop9()
    }
  }

  // ── Drag end → reorder ────────────────────────────────────────

  async function handleDragEnd(event: DragEndEvent) {
    if (!top9) return
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = top9.entries.findIndex((e) => e.id === active.id)
    const newIndex = top9.entries.findIndex((e) => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(top9.entries, oldIndex, newIndex).map((e, i) => ({
      ...e,
      position: i + 1,
    }))

    setTop9((prev) => prev ? { ...prev, entries: reordered } : null)

    try {
      const res = await fetch(`/api/top9/${top9.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: reordered.map((e) => ({ entryId: e.id, position: e.position })),
        }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setError('Грешка при пренареждане')
      fetchTop9()
    }
  }

  // ── Toggle visibility ─────────────────────────────────────────

  async function handleTogglePublic() {
    if (!top9) return
    const newValue = !top9.isPublic
    setTop9((prev) => prev ? { ...prev, isPublic: newValue } : null)
    try {
      const res = await fetch(`/api/top9/${top9.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newValue }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setError('Грешка при запазване')
      setTop9((prev) => prev ? { ...prev, isPublic: !newValue } : null)
    }
  }

  // ── Copy share link ───────────────────────────────────────────

  function handleCopyLink() {
    if (!top9) return
    navigator.clipboard.writeText(`${window.location.origin}/top9/${top9.shareToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Generate image ────────────────────────────────────────────

  async function handleGenerate() {
    if (!top9) return
    setGenerating(true)
    setGenerateError(null)
    try {
      const res  = await fetch(`/api/top9/${top9.id}/image`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTop9((prev) => prev ? { ...prev, generatedImageUrl: data.imageUrl } : null)
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Грешка при генериране')
    } finally {
      setGenerating(false)
    }
  }

  async function handleShowHistory() {
    if (history !== null) { setShowHistory((v) => !v); return }
    setShowHistory(true)
    setHistoryLoading(true)
    try {
      const res  = await fetch('/api/top9')
      const data = await res.json()
      setHistory(Array.isArray(data) ? data : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  function shareToFacebook() {
    if (!top9?.generatedImageUrl) return
    const url = encodeURIComponent(`${window.location.origin}/top9/${top9.shareToken}`)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400')
  }

  // ── Helpers ───────────────────────────────────────────────────

  const years = [сега.getFullYear(), сега.getFullYear() - 1, сега.getFullYear() - 2]

  const slotMap = new Map(top9?.entries.map((e) => [e.position, e]) ?? [])

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Month / Year picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-400"
        >
          {МЕСЕЦИ.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-400"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
        </div>
      )}

      {/* Loading */}
      {top9 === undefined && (
        <div className="py-12 text-center">
          <div className="inline-block w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state — no Top 9 for this month */}
      {top9 === null && (
        <div className="py-16 text-center rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-4xl mb-3">🏆</p>
          <h3 className="text-base font-semibold text-gray-800 mb-1">
            Top 9 за {МЕСЕЦИ[month - 1]} {year}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            Нямаш създаден Top 9 за този месец. Запази кои игри си играл!
          </p>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Създаване...' : `Създай Top 9 за ${МЕСЕЦИ[month - 1]}`}
          </button>
        </div>
      )}

      {/* Top 9 board */}
      {top9 && (
        <div className="space-y-4">

          {/* Board header */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-700">
              {МЕСЕЦИ[month - 1]} {year} · {top9.entries.length}/9 игри
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePublic}
                className={`text-xs rounded-lg px-2.5 py-1 border transition-colors ${
                  top9.isPublic
                    ? 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {top9.isPublic ? '🌍 Публичен' : '🔒 Личен'}
              </button>
              {top9.isPublic && (
                <button
                  onClick={handleCopyLink}
                  className="text-xs text-brand-600 hover:underline transition-colors"
                >
                  {copied ? '✓ Копирано' : 'Копирай линк'}
                </button>
              )}
            </div>
          </div>

          {/* 3×3 grid */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={top9.entries.map((e) => e.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 9 }, (_, i) => i + 1).map((pos) => {
                  const entry = slotMap.get(pos)
                  if (entry) {
                    return (
                      <SortableSlot
                        key={entry.id}
                        entry={entry}
                        onRemove={() => handleRemove(entry.id)}
                        onUpdatePlays={(plays) => handleUpdatePlays(entry.id, plays)}
                        disabled={saving}
                      />
                    )
                  }
                  return (
                    <button
                      key={`empty-${pos}`}
                      onClick={() => setShowSearch(true)}
                      disabled={saving || showSearch}
                      className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-400 disabled:pointer-events-none transition-colors"
                      style={{ aspectRatio: '1 / 1' }}
                      aria-label="Добави игра"
                    >
                      <span className="text-3xl leading-none">+</span>
                    </button>
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>

          <p className="text-xs text-gray-400 text-center">
            Влачи за пренареждане · Кликни на партиите за редактиране
          </p>

          {/* Search */}
          {top9.entries.length < 9 && showSearch && (
            <GameSearchInput
              onSelect={handleAddGame}
              onCancel={() => setShowSearch(false)}
            />
          )}

          {/* Add game button */}
          {top9.entries.length < 9 && !showSearch && (
            <button
              onClick={() => setShowSearch(true)}
              disabled={saving}
              className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 transition-colors"
            >
              + Добави игра от колекцията
            </button>
          )}

          {/* Generate + Share */}
          {top9.entries.length > 0 && (
            <div className="space-y-3 pt-2">
              {generateError && (
                <p className="text-sm text-red-600 text-center">{generateError}</p>
              )}

              {top9.generatedImageUrl ? (
                <>
                  {/* Image preview */}
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={top9.generatedImageUrl}
                      alt={`Top 9 — ${МЕСЕЦИ[month - 1]} ${year}`}
                      className="w-full"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={top9.generatedImageUrl}
                      download={`top9-${МЕСЕЦИ[month - 1]}-${year}.png`}
                      className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                    >
                      ⬇ Изтегли PNG
                    </a>
                    <button
                      onClick={shareToFacebook}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      📘 Facebook
                    </button>
                    {top9.isPublic && (
                      <button
                        onClick={handleCopyLink}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        🔗 {copied ? 'Копирано!' : 'Копирай линк'}
                      </button>
                    )}
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="ml-auto text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                    >
                      {generating ? '⏳ Генериране...' : '🔄 Регенерирай'}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Генериране... (може да отнеме 10–15 сек)
                    </span>
                  ) : (
                    '🖼️ Генерирай картинка за споделяне'
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── История ───────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={handleShowHistory}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
        >
          <span className="text-base">{showHistory ? '▾' : '▸'}</span>
          <span>Предишни месеци</span>
          {history !== null && history.length > 0 && (
            <span className="ml-auto text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
              {history.length}
            </span>
          )}
        </button>

        {showHistory && (
          <div className="mt-4">
            {historyLoading ? (
              <div className="py-6 text-center">
                <div className="inline-block w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !history || history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Все още нямаш запазени месеци.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {history
                  .filter((h) => !(h.month === month && h.year === year))
                  .map((h) => (
                    <button
                      key={h.id}
                      onClick={() => { setMonth(h.month); setYear(h.year); setShowHistory(false) }}
                      className="group rounded-2xl border border-gray-200 bg-white p-3 text-left hover:border-brand-400 transition-all"
                    >
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        {МЕСЕЦИ[h.month - 1]} {h.year}
                        <span className="ml-1.5 text-[10px] text-gray-400 font-normal">
                          {h.entries.length}/9
                        </span>
                      </p>
                      {/* 3 mini thumbnails */}
                      <div className="flex gap-1">
                        {h.entries.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            className="flex-1 aspect-square rounded-lg bg-gray-100 relative overflow-hidden"
                          >
                            {e.game.thumbnailUrl ? (
                              <img
                                src={e.game.thumbnailUrl}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <span className="absolute inset-0 flex items-center justify-center text-sm">🎲</span>
                            )}
                          </div>
                        ))}
                        {Array.from({ length: Math.max(0, 3 - h.entries.length) }).map((_, i) => (
                          <div key={i} className="flex-1 aspect-square rounded-lg border border-dashed border-gray-200 bg-gray-50" />
                        ))}
                      </div>
                      {h.generatedImageUrl && (
                        <p className="text-[10px] text-brand-600 mt-1.5">🖼️ Картинката е готова</p>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
