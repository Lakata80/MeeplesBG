'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="bg">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f9fafb' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '32rem', width: '100%', textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontSize: '7rem', fontWeight: 900, color: '#4f46e5', lineHeight: 1, marginBottom: '0.5rem' }}>500</p>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
              Нещо се обърка
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Възникна неочаквана грешка. Проблемът е регистриран автоматично.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{ padding: '0.625rem 1.25rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Опитай отново
              </button>
              <a
                href="/"
                style={{ padding: '0.625rem 1.25rem', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}
              >
                ← Начало
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
