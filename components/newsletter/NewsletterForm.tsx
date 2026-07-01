'use client'

import { useState, useRef, type FormEvent } from 'react'

interface Props {
  вариант?: 'нормален' | 'компактен'
}

type Статус = 'idle' | 'зареждане' | 'успех' | 'грешка'

export default function NewsletterForm({ вариант = 'нормален' }: Props) {
  const [статус, setСтатус]       = useState<Статус>('idle')
  const [съобщение, setSъобщение] = useState('')
  const входRef                   = useRef<HTMLInputElement>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = входRef.current?.value?.trim()
    if (!email) return

    setСтатус('зареждане')
    setSъобщение('')

    try {
      const res  = await fetch('/api/newsletter/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const json = await res.json() as { успех?: boolean; съобщение?: string; грешка?: string }

      if (res.ok && json.успех) {
        setСтатус('успех')
        setSъобщение(json.съобщение ?? 'Абонирахте се успешно!')
        if (входRef.current) входRef.current.value = ''
      } else {
        setСтатус('грешка')
        setSъобщение(json.грешка ?? 'Нещо се обърка. Опитай отново.')
      }
    } catch {
      setСтатус('грешка')
      setSъобщение('Грешка при връзка. Опитай отново.')
    }
  }

  if (статус === 'успех') {
    return (
      <div className={вариант === 'компактен' ? 'py-2' : 'py-4'}>
        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
          <span className="text-xl">✓</span>
          <p className="text-sm font-medium">{съобщение}</p>
        </div>
      </div>
    )
  }

  if (вариант === 'компактен') {
    return (
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          ref={входRef}
          type="email"
          required
          placeholder="Твоят имейл"
          disabled={статус === 'зареждане'}
          className="
            min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900
            placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1
            focus:ring-brand-500 disabled:opacity-50
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500
          "
        />
        <button
          type="submit"
          disabled={статус === 'зареждане'}
          className="
            rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white
            hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
            disabled:opacity-50 transition-colors
          "
        >
          {статус === 'зареждане' ? '...' : 'Абонирай'}
        </button>
        {статус === 'грешка' && (
          <p className="sr-only" role="alert">{съобщение}</p>
        )}
      </form>
    )
  }

  // Нормален вариант
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <input
          ref={входRef}
          type="email"
          required
          placeholder="Въведи своя имейл адрес"
          disabled={статус === 'зареждане'}
          className="
            w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900
            placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2
            focus:ring-brand-500 disabled:opacity-50
            dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500
          "
        />
        {статус === 'грешка' && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {съобщение}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={статус === 'зареждане'}
        className="
          rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white
          hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
          disabled:opacity-50 transition-colors whitespace-nowrap
        "
      >
        {статус === 'зареждане' ? 'Изпращане...' : 'Абонирай се безплатно'}
      </button>
    </form>
  )
}
