'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserMenu from '@/components/ui/UserMenu'
import MainNav from './MainNav'
import NotificationBell from '@/components/obshtnost/NotificationBell'
import HeaderSearchInput from './HeaderSearchInput'

export default function Header() {
  const [мобилноМеню, setМобилноМеню] = useState(false)
  const pathname = usePathname()
  const скриТърсене = pathname === '/'

  return (
    <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)] shadow-sm">
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
          <Suspense fallback={
            скриТърсене ? null : (
              <div className="hidden md:flex flex-1 max-w-xl mx-auto">
                <div className="w-full h-9 rounded-lg border border-[var(--border)] bg-white" />
              </div>
            )
          }>
            <HeaderSearchInput variant="desktop" />
          </Suspense>

          {/* Дясна страна */}
          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell />
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
        <Suspense fallback={
          скриТърсене ? null : (
            <div className="md:hidden pb-3">
              <div className="w-full h-9 rounded-lg border border-[var(--border)] bg-white" />
            </div>
          )
        }>
          <HeaderSearchInput variant="mobile" />
        </Suspense>
      </div>

      {/* Навигация */}
      <div className={`border-t border-[var(--border)] ${мобилноМеню ? 'block' : 'hidden md:block'}`}>
        <MainNav onNavClick={() => setМобилноМеню(false)} />
      </div>
    </header>
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
