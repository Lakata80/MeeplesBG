'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  className?: string
  placeholder?: string
  autoFocus?: boolean
  размер?: 'нормален' | 'голям'
}

export default function SearchBar({
  className,
  placeholder = 'Търси игра...',
  autoFocus,
  размер = 'нормален',
}: Props) {
  const [стойност, setСтойност] = useState('')
  const router = useRouter()

  function handleSubmit(е: React.FormEvent) {
    е.preventDefault()
    const query = стойност.trim()
    if (query) {
      router.push(`/игри?q=${encodeURIComponent(query)}`)
      setСтойност('')
    }
  }

  const голям = размер === 'голям'

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <div className="relative flex items-center">
        <SearchIcon
          className={`absolute left-4 text-gray-400 pointer-events-none ${голям ? 'w-5 h-5' : 'w-4 h-4'}`}
        />
        <input
          type="search"
          value={стойност}
          onChange={(е) => setСтойност(е.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Търси настолна игра"
          className={`w-full rounded-2xl border border-gray-200 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            голям
              ? 'pl-12 pr-36 py-4 text-base'
              : 'pl-10 pr-28 py-3 text-sm'
          }`}
        />
        <button
          type="submit"
          className={`absolute right-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors ${
            голям ? 'px-5 py-2.5 text-sm' : 'px-4 py-2 text-xs'
          }`}
        >
          Търси
        </button>
      </div>
    </form>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
