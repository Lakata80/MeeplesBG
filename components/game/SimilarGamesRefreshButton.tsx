'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function SimilarGamesRefreshButton() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function refresh() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('seed', String(Math.floor(Math.random() * 1_000_000)))
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <button
      onClick={refresh}
      disabled={pending}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors disabled:opacity-40"
      title="Покажи различни подобни игри"
    >
      <svg
        className={`w-4 h-4 ${pending ? 'animate-spin' : ''}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {pending ? 'Зарежда...' : 'Покажи различни'}
    </button>
  )
}
