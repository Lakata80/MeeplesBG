'use client'

import { useState }  from 'react'
import Link          from 'next/link'
import { useSession } from 'next-auth/react'

const ФОРУМ_URL = process.env.NEXT_PUBLIC_DISCOURSE_URL ?? 'https://forum.meeplesbg.com'

interface Props {
  children?: React.ReactNode
  className?: string
  variant?: 'link' | 'button'
}

export default function ForumLink({ children, className, variant = 'button' }: Props) {
  const { data: session, status } = useSession()
  const [modal, setModal]         = useState(false)

  const label = children ?? 'Към Форума →'
  const cls   = className ?? (
    variant === 'button'
      ? 'inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors'
      : 'text-gray-700 hover:text-brand-600 transition-colors'
  )

  // Зареждане — показваме неутрален линк
  if (status === 'loading') {
    return (
      <span className={cls} aria-busy>
        {label}
      </span>
    )
  }

  // Влязъл — директен линк към форума
  if (session) {
    return (
      <a href={ФОРУМ_URL} target="_blank" rel="noopener noreferrer" className={cls}>
        {label}
      </a>
    )
  }

  // Не е влязъл — показва modal
  return (
    <>
      <button onClick={() => setModal(true)} className={cls}>
        {label}
      </button>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal
          aria-label="Необходим е вход"
          onClick={(е) => е.target === е.currentTarget && setModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Трябва да влезете
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              За да посетите форума, трябва да сте влезли в профила си в MeeplesBG.
              Входът ви автоматично ще ви влезе и в Discourse.
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(ФОРУМ_URL)}` }
                className="px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
              >
                Влез в профила
              </Link>
              <button
                onClick={() => setModal(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Откажи
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
