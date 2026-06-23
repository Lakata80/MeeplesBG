'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Роля = 'USER' | 'MODERATOR' | 'ADMIN'

interface Потребител {
  id:        string
  name:      string | null
  email:     string | null
  image:     string | null
  role:      Роля
  createdAt: string
  _count:    { pendingImages: number; reviews: number }
}

const РОЛЯ_ЕТИКЕТ: Record<Роля, string> = {
  USER:      'Потребител',
  MODERATOR: 'Модератор',
  ADMIN:     'Администратор',
}

const РОЛЯ_ЦВЯТ: Record<Роля, string> = {
  USER:      'bg-gray-100 text-gray-600',
  MODERATOR: 'bg-blue-50 text-blue-700',
  ADMIN:     'bg-brand-50 text-brand-700',
}

export default function AdminUsersPage() {
  const [потребители, setПотребители] = useState<Потребител[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  async function зареди() {
    const res = await fetch('/api/admin/users')
    if (res.ok) setПотребители(await res.json())
    setLoading(false)
  }

  useEffect(() => { зареди() }, [])

  async function смениРоля(id: string, role: Роля) {
    setBusy(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role }),
    })
    if (res.ok) {
      const updated = await res.json()
      setПотребители(п => п.map(u => u.id === id ? { ...u, role: updated.role } : u))
    }
    setBusy(null)
  }

  if (loading) return <div className="container mx-auto px-4 py-12 text-gray-400">Зареждане...</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-brand-600 text-sm">← Администрация</Link>
        <h1 className="text-2xl font-bold text-brand-800">
          Потребители
          <span className="ml-2 text-base font-normal text-gray-400">({потребители.length})</span>
        </h1>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="divide-y divide-gray-50">
          {потребители.map((п) => (
            <div key={п.id} className="flex items-center gap-4 px-5 py-4">
              {/* Аватар */}
              <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-gray-100">
                {п.image ? (
                  <Image src={п.image} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                    {(п.name ?? п.email ?? '?')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Инфо */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{п.name ?? '(без име)'}</p>
                <p className="text-xs text-gray-400 truncate">{п.email}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  {new Date(п.createdAt).toLocaleDateString('bg-BG')}
                  {п._count.reviews > 0 && ` · ${п._count.reviews} ревюта`}
                  {п._count.pendingImages > 0 && ` · ${п._count.pendingImages} снимки`}
                </p>
              </div>

              {/* Роля */}
              <div className="shrink-0">
                <select
                  value={п.role}
                  disabled={busy === п.id}
                  onChange={(e) => смениРоля(п.id, e.target.value as Роля)}
                  className={`text-xs font-medium rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-300 disabled:opacity-50 ${РОЛЯ_ЦВЯТ[п.role]}`}
                >
                  {(Object.keys(РОЛЯ_ЕТИКЕТ) as Роля[]).map((r) => (
                    <option key={r} value={r}>{РОЛЯ_ЕТИКЕТ[r]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {потребители.length === 0 && (
          <p className="text-center text-gray-400 py-12">Няма потребители.</p>
        )}
      </div>
    </div>
  )
}
