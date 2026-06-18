'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CollectionStatus } from '@prisma/client'
import { добавиВКолекция, премахниОтКолекция } from '@/app/actions/collection'

interface Props {
  gameId: string
  slug: string
  текущСтатус: CollectionStatus | null
  влязъл: boolean
}

const БУТОНИ: { статус: CollectionStatus; активен: string; неактивен: string; икона: string }[] = [
  {
    статус:    'OWNS',
    активен:   'bg-blue-600 text-white border-blue-600',
    неактивен: 'border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600',
    икона:     '📦',
  },
  {
    статус:    'WISHLIST',
    активен:   'bg-amber-500 text-white border-amber-500',
    неактивен: 'border-gray-300 text-gray-700 hover:border-amber-400 hover:text-amber-600',
    икона:     '⭐',
  },
  {
    статус:    'PLAYED',
    активен:   'bg-green-600 text-white border-green-600',
    неактивен: 'border-gray-300 text-gray-700 hover:border-green-400 hover:text-green-600',
    икона:     '✅',
  },
]

const СТАТУС_ТЕКСТ: Record<CollectionStatus, { активен: string; неактивен: string }> = {
  OWNS:     { активен: 'Притежавам',  неактивен: 'Добави в колекция' },
  WISHLIST: { активен: 'Искам я',     неактивен: 'Искам я' },
  PLAYED:   { активен: 'Играл съм',   неактивен: 'Играл съм' },
  FORSALE:  { активен: 'Продавам',    неактивен: 'Продавам' },
}

export default function CollectionButtons({ gameId, slug, текущСтатус, влязъл }: Props) {
  const [зарежда, startTransition] = useTransition()
  const router = useRouter()

  function handleClick(статус: CollectionStatus) {
    if (!влязъл) {
      router.push(`/login?callbackUrl=/игри/${slug}`)
      return
    }

    startTransition(async () => {
      if (текущСтатус === статус) {
        await премахниОтКолекция(gameId, slug)
      } else {
        await добавиВКолекция(gameId, slug, статус)
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {БУТОНИ.map(({ статус, активен, неактивен, икона }) => {
        const еАктивен = текущСтатус === статус
        const текст = СТАТУС_ТЕКСТ[статус]

        return (
          <button
            key={статус}
            onClick={() => handleClick(статус)}
            disabled={зарежда}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-wait ${
              еАктивен ? активен : неактивен
            }`}
          >
            <span>{икона}</span>
            {еАктивен ? текст.активен : текст.неактивен}
          </button>
        )
      })}
    </div>
  )
}
