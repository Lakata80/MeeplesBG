'use client'

import { useEffect } from 'react'
import Link          from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center py-20">

        <p className="text-6xl mb-4">⚠️</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Нещо се обърка</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Възникна неочаквана грешка. Моля, опитайте отново или се свържете с нас,
          ако проблемът продължава.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Опитай отново
          </button>
          <Link
            href="/"
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Към началото
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">Код на грешката: {error.digest}</p>
        )}

      </div>
    </div>
  )
}
