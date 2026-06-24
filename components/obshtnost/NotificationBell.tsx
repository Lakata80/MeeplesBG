'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Notification {
  id:           string
  type:         string
  isRead:       boolean
  createdAt:    string
  threadId:     string | null
  categorySlug: string | null
  thread:       { slug: string; title: string } | null
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const [open,  setOpen]  = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const ref               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/obshtnost/notifications')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setItems(data) })
      .catch(() => {})
  }, [session])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markRead() {
    await fetch('/api/obshtnost/notifications', { method: 'PATCH' })
    setItems([])
  }

  const count = items.length

  if (!session?.user) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((o) => !o); if (!open && count > 0) markRead() }}
        className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Известия"
      >
        🔔
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Известия</p>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">Няма нови известия</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  {n.thread && n.categorySlug ? (
                    <Link
                      href={`/obshtnost/${n.categorySlug}/${n.thread.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg shrink-0">💬</span>
                      <p className="text-xs text-gray-700 leading-snug">
                        Нов отговор на <span className="font-semibold">{n.thread.title}</span>
                      </p>
                    </Link>
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-500">Известие</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
