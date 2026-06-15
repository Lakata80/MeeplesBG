'use client'

import { useState } from 'react'
import Image from 'next/image'
import CommentForm from './CommentForm'

export interface КоментарData {
  id: string
  content: string
  createdAt: string
  user: { name: string | null; image: string | null }
  replies: {
    id: string
    content: string
    createdAt: string
    user: { name: string | null; image: string | null }
  }[]
}

interface Props {
  коментари: КоментарData[]
  gameId: string
  slug: string
}

export default function CommentList({ коментари, gameId, slug }: Props) {
  const [отговорКъм, setОтговорКъм] = useState<string | null>(null)

  if (коментари.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Все още няма коментари. Бъди първият!
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {коментари.map((к) => (
        <div key={к.id}>
          <CommentCard коментар={к}>
            <button
              onClick={() => setОтговорКъм(отговорКъм === к.id ? null : к.id)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {отговорКъм === к.id ? 'Отказ' : 'Отговори'}
            </button>
          </CommentCard>

          {/* Reply form */}
          {отговорКъм === к.id && (
            <div className="ml-11 mt-3">
              <CommentForm
                gameId={gameId}
                slug={slug}
                parentId={к.id}
                onДобавен={() => setОтговорКъм(null)}
              />
            </div>
          )}

          {/* Nested replies */}
          {к.replies.length > 0 && (
            <div className="ml-11 mt-3 space-y-3 border-l-2 border-gray-100 pl-4">
              {к.replies.map((р) => (
                <CommentCard key={р.id} коментар={р} размер="малък" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CommentCard({
  коментар,
  размер = 'нормален',
  children,
}: {
  коментар: { content: string; createdAt: string; user: { name: string | null; image: string | null } }
  размер?: 'нормален' | 'малък'
  children?: React.ReactNode
}) {
  const инициали = коментар.user.name
    ? коментар.user.name.split(' ').map((н) => н[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const дата = new Date(коментар.createdAt).toLocaleDateString('bg-BG', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <div className="flex gap-3">
      {/* Аватар */}
      <div className="flex-shrink-0">
        {коментар.user.image ? (
          <Image
            src={коментар.user.image}
            alt={коментар.user.name ?? 'Потребител'}
            width={размер === 'малък' ? 28 : 36}
            height={размер === 'малък' ? 28 : 36}
            className="rounded-full object-cover"
          />
        ) : (
          <div
            className={`rounded-full bg-blue-100 text-blue-600 font-semibold flex items-center justify-center ${
              размер === 'малък' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
            }`}
          >
            {инициали}
          </div>
        )}
      </div>

      {/* Съдържание */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">
            {коментар.user.name ?? 'Анонимен'}
          </span>
          <span className="text-xs text-gray-400">{дата}</span>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
          {коментар.content}
        </p>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}
