'use client'

import { useState } from 'react'

interface Props {
  заглавие: string
  slug: string
}

export default function ShareButton({ заглавие, slug }: Props) {
  const [копирано, setКопирано] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/игри/${slug}`

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: заглавие, url })
        return
      } catch {
        // Потребителят е отказал — продължи с копирането
      }
    }

    await navigator.clipboard.writeText(url)
    setКопирано(true)
    setTimeout(() => setКопирано(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
    >
      {копирано ? (
        <>
          <span>✓</span>
          Копирано!
        </>
      ) : (
        <>
          <ShareIcon />
          Сподели
        </>
      )}
    </button>
  )
}

function ShareIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}
