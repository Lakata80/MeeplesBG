'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { type ThreadCategorySlug, КАТЕГОРИИ, EVENT_TYPES, type EventTypeName } from '@/lib/obshtnost'
import DateTimePicker from '@/components/ui/DateTimePicker'

interface Props {
  categorySlug: ThreadCategorySlug
  onCancel: () => void
}

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPES) as [EventTypeName, (typeof EVENT_TYPES)[EventTypeName]][]
const MAX_IMAGES = 3

export default function NewThreadForm({ categorySlug, onCancel }: Props) {
  const router   = useRouter()
  const кат      = КАТЕГОРИИ[categorySlug]
  const isSREШТИ = кат.db === 'SRESHTI'
  const isPAZAR  = кат.db === 'PAZAR'

  const [pending,       setPending]       = useState(false)
  const [error,         setError]         = useState('')
  const [eventType,     setEventType]     = useState<EventTypeName | ''>('')
  const [images,        setImages]        = useState<string[]>([])
  const [uploading,     setUploading]     = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!fileInputRef.current) return
    fileInputRef.current.value = ''
    if (!file) return

    const index = images.length
    if (index >= MAX_IMAGES) return

    setUploading(index)
    setError('')

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res  = await fetch(`/api/obshtnost/threads/images?index=${index}`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.грешка ?? 'Грешка при качване')
      setImages((prev) => [...prev, data.url as string])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка при качване на снимката')
    } finally {
      setUploading(null)
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

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
      images,
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
      {isPAZAR && (
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

      {/* Снимки (само PAZAR) */}
      {isPAZAR && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Снимки <span className="text-gray-400 font-normal">(по избор, до {MAX_IMAGES})</span>
          </label>

          <div className="flex flex-wrap gap-3">
            {/* Качени снимки */}
            {images.map((url, idx) => (
              <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <Image src={url} alt={`Снимка ${idx + 1}`} fill className="object-cover" sizes="96px" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center text-xs leading-none transition-colors"
                  aria-label="Премахни снимката"
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Зареждаща се снимка */}
            {uploading !== null && (
              <div className="w-24 h-24 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Бутон за добавяне */}
            {images.length < MAX_IMAGES && uploading === null && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 hover:bg-brand-50 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-brand-500 transition-colors"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-xs">Снимка</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          <p className="text-xs text-gray-400 mt-1.5">JPG, PNG или WebP · макс. 5MB на снимка</p>
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
          disabled={pending || uploading !== null}
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
