'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ThreadCategorySlug, КАТЕГОРИИ } from '@/lib/obshtnost'
import DateTimePicker from '@/components/ui/DateTimePicker'

interface Props {
  categorySlug: ThreadCategorySlug
  onCancel: () => void
}

export default function NewThreadForm({ categorySlug, onCancel }: Props) {
  const router   = useRouter()
  const кат      = КАТЕГОРИИ[categorySlug]
  const [pending, setPending] = useState(false)
  const [error,   setError]   = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setPending(true)

    const fd    = new FormData(e.currentTarget)
    const body  = {
      categorySlug,
      title:      fd.get('title') as string,
      content:    fd.get('content') as string,
      price:      fd.get('price') as string,
      eventDate:  fd.get('eventDate') as string,
      eventCity:  fd.get('eventCity') as string,
      eventSpots: fd.get('eventSpots') as string,
      eventClub:  fd.get('eventClub') as string,
    }

    try {
      const res = await fetch('/api/obshtnost/threads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.грешка ?? 'Грешка')
      router.push(`/obshtnost/${data.category}/${data.slug}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка')
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Нова тема в „{кат.label}"</h2>

      {/* Заглавие */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Заглавие *</label>
        <input
          name="title"
          required
          minLength={5}
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder="Напиши ясно заглавие..."
        />
      </div>

      {/* Купувам/Продавам — цена */}
      {кат.db === 'PAZAR' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Цена / Условие</label>
          <input
            name="price"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="напр. 45 €, Разменям, Подарявам..."
          />
          <p className="text-xs text-gray-400 mt-1">Обявата изтича автоматично след 60 дни.</p>
        </div>
      )}

      {/* Игрални срещи — полета */}
      {кат.db === 'SRESHTI' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата на срещата</label>
            <DateTimePicker name="eventDate" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Град</label>
            <input
              name="eventCity"
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="напр. София, Пловдив..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Брой места (по избор)</label>
            <input
              type="number"
              name="eventSpots"
              min={1}
              max={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="напр. 6"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Клуб (по избор)</label>
            <input
              name="eventClub"
              maxLength={150}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="напр. BoardGamers Sofia..."
            />
          </div>
        </div>
      )}

      {/* Съдържание */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Съдържание *</label>
        <textarea
          name="content"
          required
          minLength={10}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
          placeholder="Опиши подробно въпроса или предложението си..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {pending ? 'Публикуване...' : 'Публикувай'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-300 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Откажи
        </button>
      </div>
    </form>
  )
}
