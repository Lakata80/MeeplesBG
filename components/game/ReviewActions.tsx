'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reviewId: string
  isOwner:  boolean
  isAdmin:  boolean
}

export default function ReviewActions({ reviewId, isOwner, isAdmin }: Props) {
  const router  = useRouter()
  const [busy,  setBusy]  = useState(false)
  const [open,  setOpen]  = useState(false)

  async function handleDelete() {
    if (!confirm('Сигурен ли си, че искаш да изтриеш това ревю?')) return
    setBusy(true)
    await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' })
    setBusy(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Опции"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5"  r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-40 min-w-[140px]">
            {(isOwner || isAdmin) && (
              <button
                onClick={handleDelete}
                disabled={busy}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {isAdmin && !isOwner ? '🛡️ Изтрий (Админ)' : '🗑️ Изтрий'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
