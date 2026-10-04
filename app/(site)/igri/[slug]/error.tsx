'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center py-20">

        <p className="text-7xl mb-4 select-none">🎲</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Страницата не е достъпна</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Не успяхме да заредим тази игра в момента. Проблемът е регистриран
          автоматично. Опитай отново след малко.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Опитай отново
          </button>
          <Link
            href="/igri"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Всички игри
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Начало
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-400 font-mono">
            Код: {error.digest}
          </p>
        )}

      </div>
    </div>
  )
}
