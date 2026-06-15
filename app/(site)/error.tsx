'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Грешка({ error, reset }: Props) {
  useEffect(() => {
    console.error('Грешка на началната страница:', error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Нещо се обърка
        </h2>
        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
          Страницата не може да се зареди в момента. Моля, опитай отново.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Опитай отново
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:border-gray-400 transition-colors"
          >
            Начална страница
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-gray-400 font-mono">
            Код: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
