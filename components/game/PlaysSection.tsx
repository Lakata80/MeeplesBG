'use client'

import { useState, useTransition } from 'react'
import { useRouter }                from 'next/navigation'

interface PlayPlayer {
  id:       string
  name:     string
  score:    number | null
  isWinner: boolean
}

interface Play {
  id:              string
  playedAt:        string
  durationMinutes: number | null
  notes:           string | null
  visibility:      'PRIVATE' | 'PUBLIC'
  players:         PlayPlayer[]
}

interface Props {
  gameId:       string
  влязъл:       boolean
  slug:         string
  initialPlays: Play[]
}

const EMPTY_PLAYER = { name: '', score: '', isWinner: false }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PlaysSection({ gameId, влязъл, slug, initialPlays }: Props) {
  const router                          = useRouter()
  const [pending, startTransition]      = useTransition()
  const [plays, setPlays]               = useState<Play[]>(initialPlays)
  const [modalOpen, setModalOpen]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')
  const [deletingId, setDeletingId]     = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    playedAt:        today,
    durationMinutes: '',
    notes:           '',
    visibility:      'PRIVATE' as 'PRIVATE' | 'PUBLIC',
    players:         [{ ...EMPTY_PLAYER }],
  })

  function openModal() {
    setForm({ playedAt: today, durationMinutes: '', notes: '', visibility: 'PRIVATE', players: [{ ...EMPTY_PLAYER }] })
    setError('')
    setModalOpen(true)
  }

  function addPlayer() {
    setForm((f) => ({ ...f, players: [...f.players, { ...EMPTY_PLAYER }] }))
  }

  function removePlayer(i: number) {
    setForm((f) => ({ ...f, players: f.players.filter((_, idx) => idx !== i) }))
  }

  function updatePlayer(i: number, field: string, value: string | boolean) {
    setForm((f) => ({
      ...f,
      players: f.players.map((p, idx) => idx === i ? { ...p, [field]: value } : p),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.players.some((p) => !p.name.trim())) {
      setError('Всеки играч трябва да има име.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/plays', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          gameId,
          playedAt:        form.playedAt,
          durationMinutes: form.durationMinutes || null,
          notes:           form.notes || null,
          visibility:      form.visibility,
          players:         form.players,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Грешка при запис.')
        return
      }

      const newPlay: Play = await res.json()
      setPlays((prev) => [newPlay, ...prev])
      setModalOpen(false)
      startTransition(() => router.refresh())
    } catch {
      setError('Мрежова грешка. Опитай пак.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Изтриване на записа?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/plays/${id}`, { method: 'DELETE' })
      setPlays((prev) => prev.filter((p) => p.id !== id))
      startTransition(() => router.refresh())
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Заглавие */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">🎮 Дневник на игранията</h2>
          {влязъл ? (
            <button
              onClick={openModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <span>+</span> Записах игра
            </button>
          ) : (
            <a
              href={`/login?callbackUrl=/igri/${slug}`}
              className="flex items-center gap-1.5 px-4 py-2 border border-brand-300 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-50 transition-colors"
            >
              Влез за да записваш
            </a>
          )}
        </div>

        {/* Списък с играния */}
        {plays.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {влязъл ? 'Все още нямаш записани играния за тази игра.' : 'Влез в профила си за да записваш играния.'}
          </p>
        ) : (
          <div className="space-y-3">
            {plays.map((play) => (
              <div key={play.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Дата и продължителност */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-gray-700">{formatDate(play.playedAt)}</span>
                      {play.durationMinutes && (
                        <span className="text-xs text-gray-400">⏱ {play.durationMinutes} мин.</span>
                      )}
                      {play.visibility === 'PUBLIC' && (
                        <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">публично</span>
                      )}
                    </div>

                    {/* Играчи */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {play.players.map((player) => (
                        <div
                          key={player.id}
                          className={`flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-lg ${
                            player.isWinner
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-white text-gray-700 border border-gray-200'
                          }`}
                        >
                          {player.isWinner && <span>🏆</span>}
                          <span className="font-medium">{player.name}</span>
                          {player.score != null && (
                            <span className="text-gray-400 text-xs">{player.score} т.</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Бележки */}
                    {play.notes && (
                      <p className="text-xs text-gray-500 italic">{play.notes}</p>
                    )}
                  </div>

                  {/* Изтриване */}
                  <button
                    onClick={() => handleDelete(play.id)}
                    disabled={deletingId === play.id || pending}
                    className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0 disabled:opacity-40"
                    title="Изтрий"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модал */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900">Запиши игра</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Дата */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                  <input
                    type="date"
                    value={form.playedAt}
                    max={today}
                    onChange={(e) => setForm((f) => ({ ...f, playedAt: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Играчи */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Играчи</label>
                    <button
                      type="button"
                      onClick={addPlayer}
                      className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      + Добави играч
                    </button>
                  </div>

                  <div className="space-y-2">
                    {form.players.map((player, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Име"
                          value={player.name}
                          onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Точки"
                          value={player.score}
                          onChange={(e) => updatePlayer(i, 'score', e.target.value)}
                          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                        <label className="flex items-center gap-1 cursor-pointer" title="Победител">
                          <input
                            type="checkbox"
                            checked={player.isWinner}
                            onChange={(e) => updatePlayer(i, 'isWinner', e.target.checked)}
                            className="accent-amber-500"
                          />
                          <span className="text-base">🏆</span>
                        </label>
                        {form.players.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePlayer(i)}
                            className="text-gray-300 hover:text-red-400 text-xl leading-none"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Продължителност */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Продължителност (минути)</label>
                  <input
                    type="number"
                    placeholder="напр. 90"
                    min={1}
                    value={form.durationMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Бележки */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Бележки (по желание)</label>
                  <textarea
                    placeholder="Как мина играта?"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>

                {/* Видимост */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Видимост</label>
                  <div className="flex gap-3">
                    {(['PRIVATE', 'PUBLIC'] as const).map((v) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="visibility"
                          value={v}
                          checked={form.visibility === v}
                          onChange={() => setForm((f) => ({ ...f, visibility: v }))}
                          className="accent-brand-600"
                        />
                        <span className="text-sm text-gray-700">
                          {v === 'PRIVATE' ? '🔒 Само аз' : '🌐 Публично'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Грешка */}
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                {/* Бутони */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Отказ
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-wait"
                  >
                    {saving ? 'Записване...' : 'Запиши'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
