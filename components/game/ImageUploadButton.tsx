'use client'

import { useState, useRef } from 'react'

interface Props {
  slug: string
}

type State = 'idle' | 'uploading' | 'success' | 'error'

export default function ImageUploadButton({ slug }: Props) {
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [count, setCount] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Само снимки (JPG, PNG, WebP)')
      setState('error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Максимален размер: 5MB')
      setState('error')
      return
    }

    setState('uploading')
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch(`/api/game-image/${slug}`, { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.грешка ?? 'Грешка при качване')
      }
      setCount((n) => n + 1)
      setState('success')
      // Нулирай след 3 сек — позволява качване на още снимки
      setTimeout(() => { setState('idle'); if (inputRef.current) inputRef.current.value = '' }, 3000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Грешка при качване')
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  function handleDrop(е: React.DragEvent) {
    е.preventDefault()
    setDragging(false)
    const file = е.dataTransfer.files[0]
    if (file) upload(file)
  }

  return (
    <div className="w-48">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(е) => { const f = е.target.files?.[0]; if (f) upload(f) }}
      />

      <div
        onClick={() => state === 'idle' && inputRef.current?.click()}
        onDragOver={(е) => { е.preventDefault(); if (state === 'idle') setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-2.5 text-center transition-colors ${
          state === 'success'
            ? 'border-green-300 bg-green-50 cursor-default'
            : state === 'uploading'
              ? 'border-gray-200 bg-gray-50 cursor-wait'
              : dragging
                ? 'border-brand-500 bg-brand-50 cursor-pointer'
                : 'border-gray-200 hover:border-brand-400 hover:bg-brand-50/40 cursor-pointer'
        }`}
      >
        {state === 'uploading' && <p className="text-xs text-gray-400">Качване...</p>}
        {state === 'success' && (
          <p className="text-xs text-green-600 font-medium">
            ✓ Изпратена{count > 1 ? ` (${count})` : ''}
          </p>
        )}
        {(state === 'idle' || state === 'error') && (
          <>
            <UploadIcon className="w-4 h-4 mx-auto mb-1 text-gray-400" />
            <p className="text-xs font-medium text-brand-600">Предложи снимка</p>
            <p className="text-xs text-gray-400">JPG / PNG / WebP · до 5MB</p>
          </>
        )}
      </div>

      {state === 'error' && (
        <p className="text-xs text-red-500 mt-1 text-center">{errorMsg}</p>
      )}
      {count > 0 && state === 'idle' && (
        <p className="text-xs text-gray-400 mt-1 text-center">{count} изпратени</p>
      )}
    </div>
  )
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )
}
