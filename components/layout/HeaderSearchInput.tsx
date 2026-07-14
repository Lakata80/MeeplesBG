'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface Props {
  variant: 'desktop' | 'mobile'
}

export default function HeaderSearchInput({ variant }: Props) {
  const searchParams  = useSearchParams()
  const pathname      = usePathname()
  const router        = useRouter()
  const [isPending, startTransition] = useTransition()

  const наИгри = pathname === '/igri'
  const скриТърсене = pathname === '/'

  const [стойност, setСтойност] = useState(
    наИгри ? (searchParams.get('q') ?? '') : ''
  )

  useEffect(() => {
    if (наИгри) {
      setСтойност(searchParams.get('q') ?? '')
    }
  }, [наИгри, searchParams])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function navigate(query: string) {
    if (наИгри) {
      const next = new URLSearchParams(searchParams.toString())
      if (query) {
        next.set('q', query)
      } else {
        next.delete('q')
      }
      next.delete('stranica')
      startTransition(() => {
        router.push(`/igri?${next.toString()}`, { scroll: false })
      })
    } else {
      if (query) {
        startTransition(() => {
          router.push(`/igri?q=${encodeURIComponent(query)}`)
        })
      }
    }
  }

  function handleChange(е: React.ChangeEvent<HTMLInputElement>) {
    const val = е.target.value
    setСтойност(val)

    if (!наИгри) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate(val.trim())
    }, 400)
  }

  function handleSubmit(е: React.FormEvent) {
    е.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    navigate(стойност.trim())
    if (!наИгри) setСтойност('')
  }

  if (variant === 'desktop') {
    if (скриТърсене) return null
    return (
      <form
        onSubmit={handleSubmit}
        className="hidden md:flex flex-1 max-w-xl mx-auto"
        role="search"
      >
        <div className="relative flex w-full items-center">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={стойност}
            onChange={handleChange}
            placeholder="Търси игра..."
            aria-label="Търси настолна игра"
            className="w-full pl-10 pr-24 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
          />
          <button
            type="submit"
            disabled={isPending}
            className="absolute right-1.5 px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-md hover:bg-brand-700 transition-colors disabled:opacity-60"
          >
            Търси
          </button>
        </div>
      </form>
    )
  }

  // mobile
  if (скриТърсене) return null
  return (
    <form
      onSubmit={handleSubmit}
      className="md:hidden pb-3"
      role="search"
    >
      <div className="relative flex items-center">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={стойност}
          onChange={handleChange}
          placeholder="Търси игра..."
          aria-label="Търси настолна игра"
          className="w-full pl-10 pr-20 py-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute right-1.5 px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-md hover:bg-brand-700 transition-colors disabled:opacity-60"
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
