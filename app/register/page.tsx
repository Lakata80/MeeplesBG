import React, { Suspense } from 'react'
import RegisterClient from './RegisterClient'

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
