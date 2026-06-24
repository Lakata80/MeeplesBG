'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  threadId: string
  isPinned: boolean
  isClosed: boolean
}

export default function ModerateButtons({ threadId, isPinned, isClosed }: Props) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function action(act: string) {
    setLoading(true)
    await fetch(`/api/obshtnost/threads/${threadId}/moderate`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: act }),
    })
    if (act === 'delete') {
      router.back()
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
      <span className="text-xs font-semibold text-yellow-700 self-center">Модерация:</span>
      <button
        onClick={() => action(isPinned ? 'unpin' : 'pin')}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
      >
        {isPinned ? '📌 Откачи' : '📌 Закачи'}
      </button>
      <button
        onClick={() => action(isClosed ? 'open' : 'close')}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
      >
        {isClosed ? '🔓 Отвори' : '🔒 Затвори'}
      </button>
      <button
        onClick={() => {
          if (confirm('Изтрий темата? Действието е необратимо.')) action('delete')
        }}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
      >
        🗑️ Изтрий
      </button>
    </div>
  )
}
