'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  gameId:       string
  existingReview?: {
    id:          string
    title:       string
    content:     string
    rating:      number
    audience:    string | null
    playedWith:  string | null
    realPlaytime: number | null
  } | null
  onCancel?: () => void
}

export default function ReviewForm({ gameId, existingReview, onCancel }: Props) {
  const router   = useRouter()
  const isEdit   = !!existingReview

  const [title,       setTitle]       = useState(existingReview?.title       ?? '')
  const [content,     setContent]     = useState(existingReview?.content     ?? '')
  const [rating,      setRating]      = useState<number>(existingReview?.rating ?? 0)
  const [audience,    setAudience]    = useState(existingReview?.audience    ?? '')
  const [playedWith,  setPlayedWith]  = useState(existingReview?.playedWith  ?? '')
  const [realPlaytime, setRealPlaytime] = useState<string>(existingReview?.realPlaytime?.toString() ?? '')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setError('Моля избери оценка от 1 до 10'); return }
    if (!title.trim())   { setError('Заглавието е задължително'); return }
    if (!content.trim()) { setError('Текстът е задължителен'); return }

    setLoading(true)
    setError('')

    const payload = {
      gameId,
      title,
      content,
      rating,
      audience:    audience.trim()    || null,
      playedWith:  playedWith.trim()  || null,
      realPlaytime: realPlaytime ? Number(realPlaytime) : null,
    }

    const url    = isEdit ? `/api/reviews/${existingReview!.id}` : '/api/reviews'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Грешка при записване')
      return
    }

    router.refresh()
    if (onCancel) onCancel()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Предупреждение */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <strong>Напомняме:</strong> Моля пишете с уважение. Ревюта с обидни, нецензурни или подвеждащи думи ще бъдат изтрити от администратора.
      </div>

      {/* Оценка */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Оценка <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-1 flex-wrap">
          {[1,2,3,4,5,6,7,8,9,10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${
                rating === n
                  ? 'bg-brand-600 text-white border-brand-600 scale-110'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400 hover:text-brand-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1 text-xs text-gray-500">{ОценкаТекст(rating)}</p>
        )}
      </div>

      {/* Заглавие */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Заглавие <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Напр. 'Перфектна семейна игра' или 'За напреднали само'"
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Текст */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ревю <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={2000}
          placeholder="Сподели опита си с играта — какво ти хареса, какво не, изненади, запомнени моменти..."
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
        />
        <p className="text-right text-xs text-gray-400 mt-0.5">{content.length}/2000</p>
      </div>

      {/* Незадължителни полета */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            За кого е?
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            maxLength={80}
            placeholder="Напр. 'Семейства с деца'"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            С кого играя?
          </label>
          <input
            type="text"
            value={playedWith}
            onChange={(e) => setPlayedWith(e.target.value)}
            maxLength={80}
            placeholder="Напр. 'Приятели, 4 играча'"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Реално времетраене (мин.)
          </label>
          <input
            type="number"
            value={realPlaytime}
            onChange={(e) => setRealPlaytime(e.target.value)}
            min={1}
            max={600}
            placeholder="Напр. 90"
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Записване...' : isEdit ? 'Запази промените' : 'Публикувай ревюто'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Отказ
          </button>
        )}
      </div>
    </form>
  )
}

function ОценкаТекст(r: number): string {
  if (r <= 2)  return '😞 Не препоръчвам'
  if (r <= 4)  return '😐 Под средното'
  if (r <= 6)  return '🙂 Средно'
  if (r <= 8)  return '😊 Добра игра'
  if (r === 9) return '🤩 Страхотна!'
  return '🏆 Шедьовър!'
}
