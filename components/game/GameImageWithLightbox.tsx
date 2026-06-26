'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Props {
  imageUrl: string
  заглавие: string
}

export default function GameImageWithLightbox({ imageUrl, заглавие }: Props) {
  const [открита, setОткрита] = useState(false)

  const затвори = useCallback(() => setОткрита(false), [])

  useEffect(() => {
    if (!открита) return
    function handleKey(е: KeyboardEvent) {
      if (е.key === 'Escape') затвори()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [открита, затвори])

  return (
    <>
      <button
        onClick={() => setОткрита(true)}
        className="relative w-48 h-48 bg-[var(--background)] rounded-2xl overflow-hidden shadow-md border border-[var(--border)] group focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-zoom-in"
        aria-label={`Виж снимката на ${заглавие}`}
      >
        <Image
          src={imageUrl}
          alt={заглавие}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          priority
          sizes="192px"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center rounded-2xl">
          <svg
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 drop-shadow-lg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </button>

      {открита && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={затвори}
          role="dialog"
          aria-modal
          aria-label="Преглед на снимката"
        >
          <button
            onClick={затвори}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Затвори"
          >
            ✕
          </button>
          <div
            className="relative max-w-3xl max-h-[85vh] w-full"
            onClick={(е) => е.stopPropagation()}
          >
            <Image
              src={imageUrl}
              alt={заглавие}
              width={900}
              height={900}
              className="object-contain w-full h-full max-h-[85vh] rounded-xl"
              priority
            />
          </div>
        </div>
      )}
    </>
  )
}
