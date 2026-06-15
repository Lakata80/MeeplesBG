'use client'

import { useState, useEffect } from 'react'
import Link                    from 'next/link'

// Ключ в localStorage
const КЛЮЧ = 'meeplebg-cookie-consent'

// Категории, за които се иска съгласие
type Категории = {
  задължителни: true   // Винаги true, не може да се изключи
  аналитични:   boolean
  функционални: boolean
}

type Избор = { версия: 1; категории: Категории }

function запази(категории: Категории) {
  const избор: Избор = { версия: 1, категории }
  localStorage.setItem(КЛЮЧ, JSON.stringify(избор))
}

function прочети(): Избор | null {
  try {
    const raw = localStorage.getItem(КЛЮЧ)
    if (!raw) return null
    return JSON.parse(raw) as Избор
  } catch {
    return null
  }
}

export default function CookieBanner() {
  const [видим, setВидим]               = useState(false)
  const [modal, setModal]               = useState(false)
  const [аналитични, setАналитични]     = useState(true)
  const [функционални, setФункционални] = useState(true)

  useEffect(() => {
    // Показва банера само ако няма запазен избор
    if (!прочети()) setВидим(true)
  }, [])

  if (!видим) return null

  function приемиВсички() {
    запази({ задължителни: true, аналитични: true, функционални: true })
    setВидим(false)
  }

  function самоЗадължителни() {
    запази({ задължителни: true, аналитични: false, функционални: false })
    setВидим(false)
  }

  function запазиИзбор() {
    запази({ задължителни: true, аналитични, функционални })
    setВидим(false)
    setModal(false)
  }

  return (
    <>
      {/* ── Cookie Banner ───────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Управление на бисквитките"
        className="
          fixed bottom-0 left-0 right-0 z-50
          border-t border-gray-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,.08)]
          px-4 py-4 sm:px-6
        "
      >
        <div className="container mx-auto max-w-5xl flex flex-col gap-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-gray-700 leading-relaxed">
            🍪 Използваме бисквитки за подобряване на твоето преживяване.
            Задължителните са необходими за работата на сайта. Можеш да
            разрешиш аналитичните и функционалните, за да ни помогнеш да
            подобряваме услугата. Прочети{' '}
            <Link href="/biskvitki" className="underline hover:text-blue-600 whitespace-nowrap">
              Политиката ни за бисквитки
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={() => setModal(true)}
              className="
                rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700
                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors
              "
            >
              Настройки
            </button>
            <button
              onClick={самоЗадължителни}
              className="
                rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700
                hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors
              "
            >
              Само задължителните
            </button>
            <button
              onClick={приемиВсички}
              className="
                rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                transition-colors
              "
            >
              Приемам всички
            </button>
          </div>
        </div>
      </div>

      {/* ── Настройки Modal ─────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

          {/* Панел */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Настройки на бисквитките"
            className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Настройки на бисквитките
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Изберете какви бисквитки разрешавате. Задължителните не могат да
              бъдат изключени, тъй като са необходими за работата на сайта.
            </p>

            <div className="space-y-4">

              {/* Задължителни — винаги включени */}
              <ОпцияБисквитка
                id="задължителни"
                заглавие="Задължителни"
                описание="Необходими за вход, сигурност и запазване на предпочитания. Не могат да бъдат изключени."
                checked
                disabled
              />

              {/* Аналитични */}
              <ОпцияБисквитка
                id="аналитични"
                заглавие="Аналитични"
                описание="Помагат ни да разберем как се използва сайтът, за да го подобряваме (напр. Google Analytics)."
                checked={аналитични}
                onChange={setАналитични}
              />

              {/* Функционални */}
              <ОпцияБисквитка
                id="функционални"
                заглавие="Функционални"
                описание="Запомнят предпочитанията ви (напр. тема, филтри), за да не ги въвеждате всеки път."
                checked={функционални}
                onChange={setФункционални}
              />
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setModal(false)}
                className="
                  rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700
                  hover:bg-gray-50 transition-colors
                "
              >
                Отказ
              </button>
              <button
                onClick={запазиИзбор}
                className="
                  rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white
                  hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2
                  focus:ring-blue-500 focus:ring-offset-2
                "
              >
                Запази настройките
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Подкомпонент ─────────────────────────────────────────────────

function ОпцияБисквитка({
  id,
  заглавие,
  описание,
  checked,
  disabled,
  onChange,
}: {
  id:         string
  заглавие:   string
  описание:   string
  checked:    boolean
  disabled?:  boolean
  onChange?:  (v: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
        disabled
          ? 'border-gray-100 bg-gray-50 cursor-default'
          : 'border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>
          {заглавие}
          {disabled && (
            <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 font-normal">
              Задължителна
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{описание}</p>
      </div>
    </label>
  )
}
