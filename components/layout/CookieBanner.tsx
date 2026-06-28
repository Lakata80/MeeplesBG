'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'meeplebg-cookie-consent'
const EXPIRY_MS   = 365 * 24 * 60 * 60 * 1000 // 12 месеца

type ConsentValue = 'all' | 'essential'

function loadConsent(): ConsentValue | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { value, expires } = JSON.parse(raw) as { value: ConsentValue; expires: number }
    if (Date.now() > expires) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return value
  } catch {
    return null
  }
}

function saveConsent(value: ConsentValue) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ value, expires: Date.now() + EXPIRY_MS })
  )
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (loadConsent() === null) setVisible(true)
  }, [])

  function accept(value: ConsentValue) {
    saveConsent(value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Съгласие за бисквитки"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg"
    >
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">

        <p className="flex-1 text-sm text-gray-600 leading-relaxed">
          Използваме бисквитки за вход, сигурност и анализ на трафика.{' '}
          <Link href="/biskvitki" className="text-brand-600 hover:underline whitespace-nowrap">
            Научи повече
          </Link>
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => accept('essential')}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Само задължителни
          </button>
          <button
            onClick={() => accept('all')}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Приемам всички
          </button>
        </div>

      </div>
    </div>
  )
}
