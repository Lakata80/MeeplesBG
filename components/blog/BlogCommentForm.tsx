'use client'

import { useState, useTransition } from 'react'
import { useSession }               from 'next-auth/react'
import Link                         from 'next/link'
import { добавиКоментарКъмСтатия } from '@/app/actions/blogComments'

interface Props {
  postSlug:   string
  parentId?:  string
  onДобавен?: () => void
}

const МАКС = 2000

export default function BlogCommentForm({ postSlug, parentId, onДобавен }: Props) {
  const { data: session }   = useSession()
  const [текст, setТекст]   = useState('')
  const [грешка, setГрешка] = useState<string | null>(null)
  const [успех, setУспех]   = useState(false)
  const [pending, startTransition] = useTransition()

  if (!session) {
    return (
      <p className="text-sm text-gray-500">
        <Link href="/login" className="text-brand-600 hover:underline font-medium">
          Влезте в профила си
        </Link>
        , за да оставите коментар.
      </p>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setГрешка(null)
    startTransition(async () => {
      const резултат = await добавиКоментарКъмСтатия(postSlug, текст, parentId)
      if ('грешка' in резултат) {
        setГрешка(резултат.грешка)
      } else {
        setТекст('')
        setУспех(true)
        onДобавен?.()
        setTimeout(() => setУспех(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={текст}
          onChange={(е) => setТекст(е.target.value)}
          placeholder={parentId ? 'Напишете отговор…' : 'Напишете коментар…'}
          maxLength={МАКС}
          rows={parentId ? 3 : 4}
          required
          className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
          disabled={pending}
        />
        <span className={`absolute bottom-3 right-3 text-xs ${текст.length > МАКС * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
          {текст.length}/{МАКС}
        </span>
      </div>

      {грешка && (
        <p className="text-sm text-red-600">{грешка}</p>
      )}

      {успех && (
        <p className="text-sm text-green-600">Коментарът е добавен успешно!</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || текст.trim().length < 3}
          className="px-5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Изпращане…' : parentId ? 'Отговори' : 'Коментирай'}
        </button>
        {parentId && onДобавен && (
          <button
            type="button"
            onClick={onДобавен}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Откажи
          </button>
        )}
      </div>
    </form>
  )
}
