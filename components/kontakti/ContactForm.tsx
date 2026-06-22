'use client'

import { useState, type FormEvent } from 'react'
import Link                         from 'next/link'

const ТЕМИ = [
  { value: 'въпрос',        label: 'Общ въпрос' },
  { value: 'грешка',        label: 'Докладване на грешка' },
  { value: 'партньор',      label: 'Партньорство / Реклама' },
  { value: 'игра',          label: 'Добавяне / корекция на игра' },
  { value: 'поверителност', label: 'Поверителност и GDPR' },
  { value: 'друго',         label: 'Друго' },
]

type Статус = 'idle' | 'зареждане' | 'успех' | 'грешка'

export default function ContactForm() {
  const [тема, setТема]           = useState('')
  const [имейл, setИмейл]         = useState('')
  const [съобщение, setSъобщение] = useState('')
  const [статус, setСтатус]       = useState<Статус>('idle')
  const [отговор, setОтговор]     = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setСтатус('зареждане')
    setОтговор('')

    try {
      const res  = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ тема, email: имейл, съобщение }),
      })
      const json = await res.json() as { успех?: boolean; съобщение?: string; грешка?: string }

      if (res.ok && json.успех) {
        setСтатус('успех')
        setОтговор(json.съобщение ?? 'Изпратено!')
        setТема('')
        setИмейл('')
        setSъобщение('')
      } else {
        setСтатус('грешка')
        setОтговор(json.грешка ?? 'Нещо се обърка. Опитай отново.')
      }
    } catch {
      setСтатус('грешка')
      setОтговор('Грешка при връзка. Опитай отново.')
    }
  }

  if (статус === 'успех') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-xl font-semibold text-green-800 mb-2">Съобщението е изпратено!</h2>
        <p className="text-green-700 mb-6">{отговор}</p>
        <button
          onClick={() => setСтатус('idle')}
          className="text-sm text-green-700 underline hover:no-underline"
        >
          Изпрати ново съобщение
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">

      {/* Тема */}
      <div>
        <label htmlFor="тема" className="block text-sm font-medium text-gray-700 mb-1.5">
          Тема <span className="text-red-500">*</span>
        </label>
        <select
          id="тема"
          value={тема}
          onChange={(e) => setТема(e.target.value)}
          required
          disabled={статус === 'зареждане'}
          className="
            w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm
            focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500
            disabled:opacity-50 text-gray-900
          "
        >
          <option value="">— Изберете тема —</option>
          {ТЕМИ.map((т) => (
            <option key={т.value} value={т.value}>{т.label}</option>
          ))}
        </select>
      </div>

      {/* Имейл */}
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Вашият имейл <span className="text-red-500">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          value={имейл}
          onChange={(e) => setИмейл(e.target.value)}
          required
          placeholder="example@email.com"
          disabled={статус === 'зареждане'}
          autoComplete="email"
          className="
            w-full rounded-xl border border-gray-300 px-4 py-3 text-sm
            placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2
            focus:ring-brand-500 disabled:opacity-50
          "
        />
      </div>

      {/* Съобщение */}
      <div>
        <label htmlFor="съобщение" className="block text-sm font-medium text-gray-700 mb-1.5">
          Съобщение <span className="text-red-500">*</span>
        </label>
        <textarea
          id="съобщение"
          value={съобщение}
          onChange={(e) => setSъобщение(e.target.value)}
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="Опишете вашия въпрос или проблем..."
          disabled={статус === 'зареждане'}
          className="
            w-full rounded-xl border border-gray-300 px-4 py-3 text-sm resize-y
            placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2
            focus:ring-brand-500 disabled:opacity-50
          "
        />
        <p className="mt-1 text-xs text-gray-400 text-right">
          {съобщение.length} / 5000 символа
        </p>
      </div>

      {статус === 'грешка' && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {отговор}
        </div>
      )}

      <button
        type="submit"
        disabled={статус === 'зареждане'}
        className="
          w-full rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white
          hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
          disabled:opacity-50 transition-colors
        "
      >
        {статус === 'зареждане' ? 'Изпращане...' : 'Изпрати съобщение'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Личните ви данни се обработват съгласно нашата{' '}
        <Link href="/gdpr" className="underline hover:text-brand-600">
          Политика за поверителност
        </Link>
        .
      </p>
    </form>
  )
}
