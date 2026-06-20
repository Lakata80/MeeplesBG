'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'

export default function UserMenu() {
  const { data: сесия, status } = useSession()
  const [отворено, setОтворено] = useState(false)
  const менюRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function затвориПриКликВън(е: MouseEvent) {
      if (менюRef.current && !менюRef.current.contains(е.target as Node)) {
        setОтворено(false)
      }
    }
    document.addEventListener('mousedown', затвориПриКликВън)
    return () => document.removeEventListener('mousedown', затвориПриКликВън)
  }, [])

  if (status === 'loading') {
    return <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
  }

  // Не е влязъл
  if (!сесия) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Вход / Регистрация
      </Link>
    )
  }

  const потребител = сесия.user
  const инициали = потребител.name
    ? потребител.name.split(' ').map((н) => н[0]).join('').toUpperCase().slice(0, 2)
    : потребител.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="relative" ref={менюRef}>
      {/* Аватар бутон */}
      <button
        onClick={() => setОтворено(!отворено)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Потребителско меню"
        aria-expanded={отворено}
      >
        {потребител.image ? (
          <Image
            src={потребител.image}
            alt={потребител.name ?? 'Аватар'}
            width={36}
            height={36}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
            {инициали}
          </div>
        )}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${отворено ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {отворено && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {/* Потребителска информация */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {потребител.name ?? 'Потребител'}
            </p>
            <p className="text-xs text-gray-500 truncate">{потребител.email}</p>
          </div>

          {/* Меню опции */}
          <nav className="py-1">
            <Link
              href="/profil"
              onClick={() => setОтворено(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ProfileIcon />
              Профил
            </Link>
            <Link
              href="/profil"
              onClick={() => setОтворено(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CollectionIcon />
              Моята колекция
            </Link>
          </nav>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => {
                setОтворено(false)
                signOut({ callbackUrl: '/' })
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <SignOutIcon />
              Изход
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function CollectionIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}
