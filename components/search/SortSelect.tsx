'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const ОПЦИИ = [
  { стойност: 'rating', надпис: 'По рейтинг' },
  { стойност: 'year',   надпис: 'По година' },
  { стойност: 'name',   надпис: 'По азбучен ред' },
]

export default function SortSelect() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [, startTransition] = useTransition()

  const current = searchParams.get('podredba') ?? 'year'

  function handleChange(е: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(searchParams.toString())
    if (е.target.value === 'year') {
      next.delete('podredba')
    } else {
      next.set('podredba', е.target.value)
    }
    next.delete('stranica')
    startTransition(() => {
      router.push(`/igri?${next.toString()}`, { scroll: false })
    })
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      aria-label="Наредба на резултатите"
      className="text-sm border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
    >
      {ОПЦИИ.map(({ стойност, надпис }) => (
        <option key={стойност} value={стойност}>
          {надпис}
        </option>
      ))}
    </select>
  )
}
