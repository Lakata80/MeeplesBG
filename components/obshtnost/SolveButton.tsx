'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  threadId: string
  isSolved: boolean
}

export default function SolveButton({ threadId, isSolved }: Props) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/obshtnost/threads/${threadId}/solve`, { method: 'PATCH' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
        isSolved
          ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
          : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
      }`}
    >
      {isSolved ? '✓ Решена' : '○ Маркирай като решена'}
    </button>
  )
}
