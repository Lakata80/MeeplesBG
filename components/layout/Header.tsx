'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import UserMenu from '@/components/ui/UserMenu'
import MainNav from './MainNav'

export default function Header() {
  const [мобилноМеню, setМобилноМеню] = useState(false)
  const [търсене, setТърсене] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(
    (е: React.FormEvent) => {
      е.preventDefault()
      const query = търсене.trim()
      if (query) {
        router.push(`/igri?q=${encodeURIComponent(query)}`)
        setТърсене('')
      }
    },
    [търсене, router]
  )

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        {/* Главна лента */}
        <div className="flex items-center gap-4 h-16">
          {/* Лого */}
          <Link
            href="/"
            className="flex-shrink-0 text-xl font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            🎲 MeeplesBG
          </Link>

          {/* Търсачка — десктоп */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-auto">
            <div className="relative w-full">
              <input
                ref={inputRef}
                type="search"
                value={търсене}
                onChange={(е) => setТърсене(е.target.value)}
                placeholder="Търси игра..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </form>

          {/* Дясна страна */}
          <div className="flex items-center gap-3 ml-auto md:ml-0">
            <UserMenu />

            {/* Хамбургер — само мобилно */}
            <button
              onClick={() => setМобилноМеню((п) => !п)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Отвори менюто"
              aria-expanded={мобилноМеню}
            >
              {мобилноМеню ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>

        {/* Търсачка — мобилно */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <input
              type="search"
              value={търсене}
              onChange={(е) => setТърсене(е.target.value)}
              placeholder="Търси игра..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </form>
      </div>

      {/* Навигация */}
      <div className={`border-t border-gray-100 ${мобилноМеню ? 'block' : 'hidden md:block'}`}>
        <MainNav onNavClick={() => setМобилноМеню(false)} />
      </div>
    </header>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
