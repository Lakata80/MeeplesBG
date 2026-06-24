'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  threadId:  string
  replyId:   string
  isHelpful: boolean
}

export default function HelpfulButton({ threadId, replyId, isHelpful }: Props) {
  const router   = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/obshtnost/threads/${threadId}/helpful?replyId=${replyId}`, { method: 'PATCH' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
        isHelpful
          ? 'bg-green-50 border-green-300 text-green-700'
          : 'border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600'
      }`}
    >
      👍 {isHelpful ? 'Полезен' : 'Полезен?'}
    </button>
  )
}
