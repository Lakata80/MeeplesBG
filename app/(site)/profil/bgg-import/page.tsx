'use client'

import { useState, useRef, useEffect } from 'react'
import Link                             from 'next/link'

// ── Типове ────────────────────────────────────────────────────

type СтатусИмпорт = 'idle' | 'зареждане' | 'завършен' | 'грешка'

interface СъбитиеСSE {
  тип:            'прогрес' | 'завършен' | 'грешка'
  съобщение?:     string
  общо?:          number
  добавени?:      number
  вечеВКолекция?: number
  новиЗаБаза?:    number
}

interface Резултат {
  добавени:      number
  вечеВКолекция: number
  новиЗаБаза:    number
}

// ── Компонент ─────────────────────────────────────────────────

export default function BggИмпортСтраница() {
  const [username, setUsername]   = useState('')
  const [статус, setСтатус]       = useState<СтатусИмпорт>('idle')
  const [лог, setЛог]             = useState<string[]>([])
  const [резултат, setРезултат]   = useState<Резултат | null>(null)
  const [грешка, setГрешка]       = useState('')
  const логRef                    = useRef<HTMLDivElement>(null)
  const esRef                     = useRef<EventSource | null>(null)

  // Авто-скрол на лога
  useEffect(() => {
    if (логRef.current) {
      логRef.current.scrollTop = логRef.current.scrollHeight
    }
  }, [лог])

  function добавиЛог(text: string) {
    setЛог((prev) => [...prev, text])
  }

  function стартирай() {
    if (!username.trim() || статус === 'зареждане') return

    // Изчисти предишен стейт
    setСтатус('зареждане')
    setЛог([])
    setРезултат(null)
    setГрешка('')

    // Затвори предишна SSE връзка
    esRef.current?.close()

    const url = `/api/bgg/import-collection?bggUsername=${encodeURIComponent(username.trim())}`
    const es  = new EventSource(url)
    esRef.current = es

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const данни = JSON.parse(event.data) as СъбитиеСSE

        if (данни.съобщение) добавиЛог(данни.съобщение)

        if (данни.тип === 'завършен') {
          setСтатус('завършен')
          setРезултат({
            добавени:      данни.добавени      ?? 0,
            вечеВКолекция: данни.вечеВКолекция ?? 0,
            новиЗаБаза:    данни.новиЗаБаза    ?? 0,
          })
          es.close()
        }

        if (данни.тип === 'грешка') {
          setСтатус('грешка')
          setГрешка(данни.съобщение ?? 'Неизвестна грешка.')
          es.close()
        }
      } catch {
        // Невалиден JSON — пропускаме
      }
    }

    es.onerror = () => {
      setСтатус('грешка')
      setГрешка('Загубена връзка. Опитай отново.')
      es.close()
    }
  }

  // Изчисти при unmount
  useEffect(() => () => { esRef.current?.close() }, [])

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">

      {/* Хедър */}
      <div className="mb-8">
        <Link href="/profil" className="text-sm text-brand-600 hover:underline mb-3 inline-block">
          ← Назад към профила
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Импортирай колекция от BGG</h1>
        <p className="mt-2 text-sm text-gray-500">
          Въведи BGG потребителското си име и колекцията ти ще се синхронизира автоматично.
          Ако дадена игра не съществува в нашата база, ще я добавим от BoardGameGeek.
        </p>
      </div>

      {/* Форма */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <label htmlFor="bgg-username" className="block text-sm font-medium text-gray-700 mb-2">
          BGG потребителско име
        </label>
        <div className="flex gap-3">
          <input
            id="bgg-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && стартирай()}
            placeholder="напр. TheBoardGameGeek"
            disabled={статус === 'зареждане'}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="
              flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm
              placeholder:text-gray-400 focus:border-brand-500 focus:outline-none
              focus:ring-2 focus:ring-brand-500 disabled:opacity-50
            "
          />
          <button
            onClick={стартирай}
            disabled={!username.trim() || статус === 'зареждане'}
            className="
              rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white
              hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500
              focus:ring-offset-2 disabled:opacity-50 transition-colors whitespace-nowrap
            "
          >
            {статус === 'зареждане' ? 'Импортирам...' : 'Импортирай'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Колекцията трябва да е публична в BGG настройките.
        </p>
      </div>

      {/* Лог на прогреса */}
      {(лог.length > 0 || статус === 'зареждане') && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
            {статус === 'зареждане' && (
              <span className="inline-block h-3 w-3 rounded-full bg-brand-500 animate-pulse" />
            )}
            <span className="text-sm font-medium text-gray-700">Прогрес на импорта</span>
          </div>
          <div
            ref={логRef}
            className="px-4 py-3 space-y-1.5 max-h-56 overflow-y-auto font-mono text-xs text-gray-600"
          >
            {лог.map((ред, i) => (
              <p key={i} className="flex gap-2">
                <span className="text-gray-400 flex-shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                <span>{ред}</span>
              </p>
            ))}
            {статус === 'зареждане' && (
              <p className="flex gap-2 text-brand-500">
                <span className="text-gray-400 flex-shrink-0">  </span>
                <span>▌</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Резултат при успех */}
      {статус === 'завършен' && резултат && (
        <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-3 mb-5">
            <span className="text-2xl flex-shrink-0">🎉</span>
            <div>
              <h2 className="font-semibold text-green-900 text-base">Импортът е завършен!</h2>
              <p className="text-sm text-green-700 mt-0.5">Колекцията ти е синхронизирана с BoardGameGeek.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <РезултатКутия
              стойност={резултат.добавени}
              етикет="Добавени в колекцията"
              цвят="green"
            />
            <РезултатКутия
              стойност={резултат.вечеВКолекция}
              етикет="Вече в колекцията"
              цвят="blue"
            />
            <РезултатКутия
              стойност={резултат.новиЗаБаза}
              етикет="Нови игри в базата"
              цвят="purple"
            />
          </div>
          <div className="mt-5 flex gap-3">
            <Link
              href="/profil"
              className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
            >
              Виж профила →
            </Link>
            <button
              onClick={() => { setСтатус('idle'); setЛог([]); setРезултат(null) }}
              className="rounded-xl border border-green-300 px-4 py-2.5 text-sm font-medium text-green-800 hover:bg-green-100 transition-colors"
            >
              Нов импорт
            </button>
          </div>
        </div>
      )}

      {/* Грешка */}
      {статус === 'грешка' && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="font-semibold text-red-800 mb-1">Грешка при импорта</p>
              <p className="text-sm text-red-700">{грешка}</p>
              <button
                onClick={() => { setСтатус('idle'); setЛог([]); setГрешка('') }}
                className="mt-3 text-sm text-red-700 underline hover:no-underline"
              >
                Опитай отново
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Бележки */}
      <div className="mt-8 rounded-xl bg-brand-50 border border-brand-100 p-4">
        <h3 className="text-sm font-semibold text-brand-900 mb-2">Как работи?</h3>
        <ul className="space-y-1.5 text-sm text-brand-800">
          <li className="flex gap-2"><span>🎲</span><span><strong>Притежаваш</strong> → добавя се като "Колекция"</span></li>
          <li className="flex gap-2"><span>🎯</span><span><strong>Искаш да играеш</strong> → добавя се като "Искам да играя"</span></li>
          <li className="flex gap-2"><span>🕹️</span><span><strong>Играл преди</strong> → добавя се като "Играл съм"</span></li>
          <li className="flex gap-2"><span>💰</span><span><strong>За продажба</strong> → добавя се като "За продажба"</span></li>
        </ul>
      </div>
    </div>
  )
}

// ── Подкомпонент ─────────────────────────────────────────────

function РезултатКутия({
  стойност,
  етикет,
  цвят,
}: {
  стойност: number
  етикет:   string
  цвят:     'green' | 'blue' | 'purple'
}) {
  const стилове = {
    green:  'bg-green-100 text-green-800',
    blue:   'bg-brand-100 text-brand-800',
    purple: 'bg-purple-100 text-purple-800',
  }
  return (
    <div className={`rounded-xl p-3 text-center ${стилове[цвят]}`}>
      <p className="text-2xl font-bold">{стойност}</p>
      <p className="text-xs mt-0.5 leading-tight">{етикет}</p>
    </div>
  )
}
