'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface PendingItem {
  id:        string
  url:       string
  createdAt: string
  game:      { titleBg: string; titleEn: string | null; slug: string }
  user:      { email: string | null; name: string | null }
}

export default function AdminPendingImages() {
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/images')
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function act(id: string, action: 'approve' | 'reject') {
    setBusy(id)
    await fetch(`/api/admin/images/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await load()
    setBusy(null)
  }

  if (loading) return <div className="container mx-auto px-4 py-12 text-gray-400">Зареждане...</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-brand-800 mb-6">
        Снимки за одобрение
        {items.length > 0 && <span className="ml-2 text-base font-normal text-gray-400">({items.length})</span>}
      </h1>

      {items.length === 0 ? (
        <p className="text-gray-400 py-12 text-center">Няма чакащи снимки.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-[var(--border)] rounded-2xl p-4 flex gap-4 items-start">
              {/* Снимка */}
              <div className="relative w-32 h-32 shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <Image src={item.url} alt="" fill className="object-contain p-1" />
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <Link href={`/igri/${item.game.slug}`} target="_blank"
                  className="font-semibold text-brand-700 hover:underline">
                  {item.game.titleBg || item.game.titleEn}
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">
                  от {item.user.name ?? item.user.email} · {new Date(item.createdAt).toLocaleDateString('bg-BG')}
                </p>
                <p className="text-xs text-gray-300 mt-1 truncate">{item.url}</p>

                <div className="flex gap-2 mt-3">
                  <button
                    disabled={busy === item.id}
                    onClick={() => act(item.id, 'approve')}
                    className="px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    {busy === item.id ? '...' : '✓ Одобри'}
                  </button>
                  <button
                    disabled={busy === item.id}
                    onClick={() => act(item.id, 'reject')}
                    className="px-4 py-1.5 bg-white text-red-500 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    ✕ Отхвърли
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
