'use client'

import type { Metadata }          from 'next'
import { useState, type FormEvent } from 'react'
import Link                         from 'next/link'

// Метаданните не могат да бъдат в 'use client' файл — използваме отделен layout или metadata export.
// Вместо това, SEO се задава в generateMetadata от parent layout.

const ТЕМИ = [
  { value: 'въпрос',         label: 'Общ въпрос' },
  { value: 'грешка',         label: 'Докладване на грешка' },
  { value: 'партньор',       label: 'Партньорство / Реклама' },
  { value: 'игра',           label: 'Добавяне / корекция на игра' },
  { value: 'поверителност',  label: 'Поверителност и GDPR' },
  { value: 'друго',          label: 'Друго' },
]

type Статус = 'idle' | 'зареждане' | 'успех' | 'грешка'

export default function КонтактиСтраница() {
  const [тема, setТема]             = useState('')
  const [имейл, setИмейл]           = useState('')
  const [съобщение, setSъобщение]   = useState('')
  const [статус, setСтатус]         = useState<Статус>('idle')
  const [отговор, setОтговор]       = useState('')

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

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10">
        <p className="text-sm text-blue-600 font-medium mb-2">Свържете се с нас</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Контакти</h1>
        <p className="text-gray-500">
          Имате въпрос, предложение или забелязахте проблем? Пишете ни!
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">

        {/* Форма */}
        <div>
          {статус === 'успех' ? (
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
          ) : (
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
                    focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
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
                <label htmlFor="имейл" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Вашият имейл <span className="text-red-500">*</span>
                </label>
                <input
                  id="имейл"
                  type="email"
                  value={имейл}
                  onChange={(e) => setИмейл(e.target.value)}
                  required
                  placeholder="example@email.com"
                  disabled={статус === 'зареждане'}
                  autoComplete="email"
                  className="
                    w-full rounded-xl border border-gray-300 px-4 py-3 text-sm
                    placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2
                    focus:ring-blue-500 disabled:opacity-50
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
                    placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2
                    focus:ring-blue-500 disabled:opacity-50
                  "
                />
                <p className="mt-1 text-xs text-gray-400 text-right">
                  {съобщение.length} / 5000 символа
                </p>
              </div>

              {статус === 'грешка' && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {отговор}
                </div>
              )}

              <button
                type="submit"
                disabled={статус === 'зареждане'}
                className="
                  w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 transition-colors
                "
              >
                {статус === 'зареждане' ? 'Изпращане...' : 'Изпрати съобщение'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Личните ви данни се обработват съгласно нашата{' '}
                <Link href="/gdpr" className="underline hover:text-blue-600">
                  Политика за поверителност
                </Link>
                .
              </p>
            </form>
          )}
        </div>

        {/* Sidebar с информация */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Информация за контакт</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="text-lg flex-shrink-0">📧</span>
                <div>
                  <p className="font-medium text-gray-900">Имейл</p>
                  <a href="mailto:contact@meeplebg.com" className="text-blue-600 hover:underline">
                    contact@meeplebg.com
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-lg flex-shrink-0">🔒</span>
                <div>
                  <p className="font-medium text-gray-900">Поверителност / GDPR</p>
                  <a href="mailto:privacy@meeplebg.com" className="text-blue-600 hover:underline">
                    privacy@meeplebg.com
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-lg flex-shrink-0">⏱️</span>
                <div>
                  <p className="font-medium text-gray-900">Час на отговор</p>
                  <p>До 2 работни дни</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-sm font-semibold text-blue-900 mb-3">🎲 Форум</h2>
            <p className="text-sm text-blue-700 mb-3">
              За бързи въпроси относно настолни игри, форумът е най-доброто място.
            </p>
            <Link
              href="/forum"
              className="inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Към форума →
            </Link>
          </div>
        </aside>

      </div>
    </main>
  )
}
