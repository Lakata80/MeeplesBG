'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ThreadCategorySlug, КАТЕГОРИИ, EVENT_TYPES, type EventTypeName } from '@/lib/obshtnost'
import DateTimePicker from '@/components/ui/DateTimePicker'

interface Props {
  categorySlug: ThreadCategorySlug
  onCancel: () => void
}

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPES) as [EventTypeName, (typeof EVENT_TYPES)[EventTypeName]][]

export default function NewThreadForm({ categorySlug, onCancel }: Props) {
  const router   = useRouter()
  const кат      = КАТЕГОРИИ[categorySlug]
  const isSREШТИ = кат.db === 'SRESHTI'

  const [pending,   setPending]   = useState(false)
  const [error,     setError]     = useState('')
  const [eventType, setEventType] = useState<EventTypeName | ''>('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (isSREШТИ && !eventType) {
      setError('Моля изберете тип събитие.')
      return
    }

    setPending(true)

    const fd   = new FormData(e.currentTarget)
    const body = {
      categorySlug,
      title:        fd.get('title') as string,
      content:      fd.get('content') as string,
      price:        fd.get('price') as string,
      eventType:    eventType || undefined,
      eventDate:    fd.get('eventDate') as string,
      eventEndDate: fd.get('eventEndDate') as string,
      eventCity:    fd.get('eventCity') as string,
      eventSpots:   fd.get('eventSpots') as string,
      eventClub:    fd.get('eventClub') as string,
    }

    try {
      const res  = await fetch('/api/obshtnost/threads', {
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
      <h2 className="font-semibold text-gray-900">
        {isSREШТИ ? 'Ново събитие' : `Нова тема в „${кат.label}"`}
      </h2>

      {/* Тип събитие (само SRESHTI) */}
      {isSREШТИ && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Тип събитие *</label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPE_OPTIONS.map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setEventType(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  eventType === key
                    ? `${cfg.color} border-current`
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Заглавие */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isSREШТИ ? 'Заглавие на събитието *' : 'Заглавие *'}
        </label>
        <input
          name="title"
          required
          minLength={5}
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          placeholder={isSREШТИ ? 'напр. Турнир по Catan — Пловдив 2026' : 'Напиши ясно заглавие...'}
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

      {/* Календар на събития — полета */}
      {isSREШТИ && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Начало *</label>
              <DateTimePicker name="eventDate" requireFuture={true} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Край <span className="text-gray-400 font-normal">(по избор)</span>
              </label>
              <DateTimePicker name="eventEndDate" requireFuture={false} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Клуб / Място <span className="text-gray-400 font-normal">(по избор)</span></label>
              <input
                name="eventClub"
                maxLength={150}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="напр. BoardGamers Sofia..."
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Места <span className="text-gray-400 font-normal">(по избор)</span></label>
            <input
              type="number"
              name="eventSpots"
              min={1}
              max={9999}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="напр. 16"
            />
          </div>
        </div>
      )}

      {/* Съдържание */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isSREШТИ ? 'Описание *' : 'Съдържание *'}
        </label>
        <textarea
          name="content"
          required
          minLength={10}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
          placeholder={isSREШТИ
            ? 'Опиши събитието — програма, условия за участие, контакт...'
            : 'Опиши подробно въпроса или предложението си...'
          }
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
