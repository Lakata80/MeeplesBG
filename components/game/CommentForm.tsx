'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { добавиКоментар } from '@/app/actions/comments'

interface Props {
  gameId: string
  slug: string
  parentId?: string
  onДобавен?: () => void
}

export default function CommentForm({ gameId, slug, parentId, onДобавен }: Props) {
  const { status } = useSession()
  const [текст, setТекст] = useState('')
  const [грешка, setГрешка] = useState<string | null>(null)
  const [зарежда, setЗарежда] = useState(false)
  const [успех, setУспех] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (status === 'loading') return null

  if (status === 'unauthenticated') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-600">
        <Link href={`/login?callbackUrl=/igri/${slug}`} className="text-brand-600 hover:underline font-medium">
          Влез в акаунта си
        </Link>
        , за да коментираш.
      </div>
    )
  }

  async function handleSubmit(е: React.FormEvent) {
    е.preventDefault()
    setГрешка(null)

    if (!текст.trim()) return

    setЗарежда(true)
    const резултат = await добавиКоментар(gameId, slug, текст, parentId)
    setЗарежда(false)

    if (резултат.грешка) {
      setГрешка(резултат.грешка)
    } else {
      setТекст('')
      setУспех(true)
      setTimeout(() => setУспех(false), 3000)
      onДобавен?.()
    }
  }

  const оставащи = 2000 - текст.length

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        ref={textareaRef}
        value={текст}
        onChange={(е) => setТекст(е.target.value)}
        placeholder={parentId ? 'Напиши отговор...' : 'Напиши коментар...'}
        rows={parentId ? 3 : 4}
        maxLength={2000}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      />

      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs ${оставащи < 100 ? 'text-red-500' : 'text-gray-400'}`}>
          {оставащи} символа
        </span>

        <div className="flex items-center gap-2">
          {успех && (
            <span className="text-xs text-green-600 font-medium">
              ✓ Коментарът е добавен!
            </span>
          )}
          {грешка && (
            <span className="text-xs text-red-600">{грешка}</span>
          )}
          <button
            type="submit"
            disabled={зарежда || текст.trim().length < 3}
            className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {зарежда ? 'Изпращане...' : parentId ? 'Отговори' : 'Публикувай'}
          </button>
        </div>
      </div>
    </form>
  )
}
