'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  threadId:    string
  isClosed:    boolean
  isLoggedIn:  boolean
}

export default function ReplyForm({ threadId, isClosed, isLoggedIn }: Props) {
  const router  = useRouter()
  const [text,    setText]    = useState('')
  const [pending, setPending] = useState(false)
  const [error,   setError]   = useState('')

  if (isClosed) {
    return (
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 text-center">
        🔒 Темата е затворена за нови отговори.
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-6 p-4 bg-brand-50 border border-brand-200 rounded-xl text-sm text-center">
        <a href="/login" className="font-semibold text-brand-600 hover:underline">Влез в профила си</a>
        {' '}за да отговориш.
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setError('')
    setPending(true)

    try {
      const res = await fetch(`/api/obshtnost/threads/${threadId}/replies`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.грешка ?? 'Грешка')
      setText('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Грешка')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Напиши отговор..."
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending || text.trim().length < 2}
        className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Изпращане...' : 'Отговори'}
      </button>
    </form>
  )
}
