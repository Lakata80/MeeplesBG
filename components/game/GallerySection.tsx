'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Props {
  imageUrl?: string | null
  thumbnailUrl?: string | null
  заглавие: string
}

export default function GallerySection({ imageUrl, thumbnailUrl, заглавие }: Props) {
  const снимки = [
    imageUrl,
    thumbnailUrl !== imageUrl ? thumbnailUrl : null,
  ].filter(Boolean) as string[]

  const [активна, setАктивна] = useState<string | null>(null)

  const затвори = useCallback(() => setАктивна(null), [])

  useEffect(() => {
    if (!активна) return
    function handleKey(е: KeyboardEvent) {
      if (е.key === 'Escape') затвори()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [активна, затвори])

  // Скрий секцията ако няма нито една реална снимка
  if (снимки.length === 0) return null

  // Попълни до 4 слота (останалите са placeholder-и)
  const СЛОТОВЕ = 4
  const плейсхолдъри = СЛОТОВЕ - снимки.length

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Галерия</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {снимки.map((url, i) => (
            <button
              key={i}
              onClick={() => setАктивна(url)}
              className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Снимка ${i + 1} на ${заглавие}`}
            >
              <Image
                src={url}
                alt={`${заглавие} — снимка ${i + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6" />
              </div>
            </button>
          ))}

          {Array.from({ length: плейсхолдъри }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-300"
            >
              <span className="text-2xl">🖼️</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {активна && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={затвори}
          role="dialog"
          aria-modal
          aria-label="Преглед на снимка"
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
              src={активна}
              alt={заглавие}
              width={900}
              height={900}
              className="object-contain w-full h-full max-h-[85vh] rounded-xl"
              priority
            />
          </div>
        </div>
      )}
    </section>
  )
}

function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
    </svg>
  )
}
