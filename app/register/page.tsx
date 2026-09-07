import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Регистрация | MeeplesBG',
  robots: { index: false, follow: false },
}

export default function РегистрацияСтраница() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Зареждане...
        </div>
      }
    >
      <RegisterClient />
    </Suspense>
  )
}
