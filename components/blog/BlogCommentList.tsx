'use client'

import { useState }       from 'react'
import Image              from 'next/image'
import BlogCommentForm    from './BlogCommentForm'

// ── Тип за данни от сървъра ───────────────────────────────────

export interface БлогКоментарData {
  id:        string
  content:   string
  createdAt: string
  user:      { name: string | null; image: string | null }
  replies:   {
    id:        string
    content:   string
    createdAt: string
    user:      { name: string | null; image: string | null }
  }[]
}

// ── Форматиране на дата ───────────────────────────────────────

const ФОРМАТ_ДАТА = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'long' })

function форматДата(iso: string): string {
  return ФОРМАТ_ДАТА.format(new Date(iso))
}

// ── Аватар ───────────────────────────────────────────────────

function Аватар({ image, name }: { image: string | null; name: string | null }) {
  const initials = (name ?? '?').charAt(0).toUpperCase()
  return image ? (
    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
      <Image src={image} alt={name ?? ''} fill className="object-cover" sizes="32px" />
    </div>
  ) : (
    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-sm font-semibold shrink-0">
      {initials}
    </div>
  )
}

// ── Ред на коментар ───────────────────────────────────────────

function КоментарРед({
  коментар,
  postSlug,
  е_отговор = false,
}: {
  коментар:   БлогКоментарData | БлогКоментарData['replies'][number]
  postSlug:   string
  е_отговор?: boolean
}) {
  const [отговор, setОтговор] = useState(false)

  return (
    <div className={е_отговор ? 'ml-10' : ''}>
      <div className="flex gap-3">
        <Аватар image={коментар.user.image} name={коментар.user.name} />
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="flex items-baseline gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-gray-900">
                {коментар.user.name ?? 'Анонимен'}
              </span>
              <span className="text-xs text-gray-400">{форматДата(коментар.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {коментар.content}
            </p>
          </div>

          {/* Бутон за отговор (само за топ-ниво) */}
          {!е_отговор && (
            <button
              onClick={() => setОтговор((v) => !v)}
              className="mt-1.5 ml-2 text-xs text-gray-400 hover:text-brand-600 transition-colors"
            >
              {отговор ? 'Откажи' : 'Отговори'}
            </button>
          )}

          {/* Форма за отговор */}
          {отговор && (
            <div className="mt-3 ml-2">
              <BlogCommentForm
                postSlug={postSlug}
                parentId={коментар.id}
                onДобавен={() => setОтговор(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Главен компонент ─────────────────────────────────────────

export default function BlogCommentList({
  коментари,
  postSlug,
}: {
  коментари: БлогКоментарData[]
  postSlug:  string
}) {
  if (коментари.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Все още няма коментари. Бъди първият!
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {коментари.map((к) => (
        <div key={к.id} className="space-y-3">
          <КоментарРед коментар={к} postSlug={postSlug} />
          {к.replies.map((р) => (
            <КоментарРед key={р.id} коментар={р} postSlug={postSlug} е_отговор />
          ))}
        </div>
      ))}
    </div>
  )
}
