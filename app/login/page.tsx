import React, { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function ВходСтраница() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Зареждане...
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
