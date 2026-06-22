'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  текущаСтраница: number
  общоСтраници: number
}

function страниции(текуща: number, общо: number): (number | '…')[] {
  if (общо <= 7) return Array.from({ length: общо }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]

  if (текуща > 3) pages.push('…')

  const start = Math.max(2, текуща - 2)
  const end   = Math.min(общо - 1, текуща + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  if (текуща < общо - 2) pages.push('…')

  pages.push(общо)
  return pages
}

export default function Pagination({ текущаСтраница, общоСтраници }: Props) {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [, startTransition] = useTransition()

  if (общоСтраници <= 1) return null

  function навигирай(страница: number) {
    const next = new URLSearchParams(searchParams.toString())
    if (страница === 1) {
      next.delete('stranica')
    } else {
      next.set('stranica', String(страница))
    }
    startTransition(() => {
      router.push(`/igri?${next.toString()}`, { scroll: true })
    })
  }

  const nums = страниции(текущаСтраница, общоСтраници)

  return (
    <nav aria-label="Странициране" className="flex items-center justify-center gap-1 mt-8">
      {/* Назад */}
      <button
        onClick={() => навигирай(текущаСтраница - 1)}
        disabled={текущаСтраница <= 1}
        aria-label="Предишна страница"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ←
      </button>

      {/* Номера */}
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => навигирай(n)}
            aria-label={`Страница ${n}`}
            aria-current={n === текущаСтраница ? 'page' : undefined}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              n === текущаСтраница
                ? 'bg-brand-600 text-white border border-brand-600'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {n}
          </button>
        )
      )}

      {/* Напред */}
      <button
        onClick={() => навигирай(текущаСтраница + 1)}
        disabled={текущаСтраница >= общоСтраници}
        aria-label="Следваща страница"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        →
      </button>
    </nav>
  )
}
