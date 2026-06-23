'use client'

import { useState }   from 'react'
import Link           from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession }  from 'next-auth/react'

const ФОРУМ_URL = process.env.NEXT_PUBLIC_DISCOURSE_URL ?? 'https://forum.meeplesbg.com'

const ЛИНКОВЕ = [
  { href: '/igri',   label: 'Игри',    dropdown: true },
  { href: '/top',    label: 'Топ 100' },
  { href: '/novini', label: 'Новини' },
  { href: '/форум',  label: 'Форум',   forum: true },
]

const КАТЕГОРИИ = [
  { href: '/igri?tip=Strategy',    label: 'Стратегически' },
  { href: '/igri?tip=Thematic',    label: 'Тематични' },
  { href: '/igri?tip=Family',      label: 'Семейни' },
  { href: '/igri?tip=Party',       label: 'Парти' },
  { href: '/igri?tip=Abstract',    label: 'Абстрактни' },
  { href: '/igri?tip=Cooperative', label: 'Кооперативни' },
]

interface Props {
  onNavClick?: () => void
}

export default function MainNav({ onNavClick }: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [игриDropdown, setИгриDropdown] = useState(false)

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav aria-label="Главна навигация">
      <ul className="container mx-auto px-4 flex flex-col md:flex-row md:items-center gap-0 md:gap-1">
        {ЛИНКОВЕ.map((линк) =>
          линк.dropdown ? (
            <li
              key={линк.href}
              className="relative"
              onMouseEnter={() => setИгриDropdown(true)}
              onMouseLeave={() => setИгриDropdown(false)}
            >
              <Link
                href={линк.href}
                onClick={onNavClick}
                className={`flex items-center gap-1 px-3 py-3 md:py-4 text-sm font-medium transition-colors border-b-2 ${
                  isActive(линк.href)
                    ? 'text-brand-600 border-brand-600'
                    : 'text-gray-600 border-transparent hover:text-brand-600'
                }`}
              >
                {линк.label}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${игриDropdown ? 'rotate-180' : ''}`}
                />
              </Link>

              {игриDropdown && (
                <div className="absolute left-0 top-full w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  {КАТЕГОРИИ.map((к) => (
                    <Link
                      key={к.href}
                      href={к.href}
                      onClick={() => {
                        setИгриDropdown(false)
                        onNavClick?.()
                      }}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                    >
                      {к.label}
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      href="/igri"
                      onClick={() => {
                        setИгриDropdown(false)
                        onNavClick?.()
                      }}
                      className="block px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      Всички игри →
                    </Link>
                  </div>
                </div>
              )}
            </li>
          ) : (
            <li key={линк.href}>
              {(линк as { forum?: boolean }).forum ? (
                // Форум — директно към Discourse ако е влязъл, иначе към /вход
                session ? (
                  <a
                    href={ФОРУМ_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={onNavClick}
                    className="block px-3 py-3 md:py-4 text-sm font-medium transition-colors border-b-2 text-gray-600 border-transparent hover:text-brand-600"
                  >
                    {линк.label}
                  </a>
                ) : (
                  <Link
                    href="/login"
                    onClick={onNavClick}
                    className="block px-3 py-3 md:py-4 text-sm font-medium transition-colors border-b-2 text-gray-600 border-transparent hover:text-brand-600"
                  >
                    {линк.label}
                  </Link>
                )
              ) : (
                <Link
                  href={линк.href}
                  onClick={onNavClick}
                  className={`block px-3 py-3 md:py-4 text-sm font-medium transition-colors border-b-2 ${
                    isActive(линк.href)
                      ? 'text-brand-600 border-brand-600'
                      : 'text-gray-600 border-transparent hover:text-brand-600'
                  }`}
                >
                  {линк.label}
                </Link>
              )}
            </li>
          )
        )}
      </ul>
    </nav>
  )
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}
