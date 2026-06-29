import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Вход | MeeplesBG',
  description: 'Влез в MeeplesBG с Google, Facebook или имейл.',
}

export default function ВходСтраница() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="h-10 w-40 mx-auto bg-gray-200 rounded-lg animate-pulse mb-8" />
        <div className="bg-white rounded-2xl border border-[var(--border)] h-96 animate-pulse" />
      </div>
    </div>
  )
}
