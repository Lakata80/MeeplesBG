'use client'

import { useState } from 'react'

export default function ShareButtons({ title }: { title: string }) {
  const [копирано, setКопирано] = useState(false)

  function копирайЛинк() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setКопирано(true)
      setTimeout(() => setКопирано(false), 2000)
    })
  }

  function споделиФейсбук() {
    const url = encodeURIComponent(window.location.href)
    const t   = encodeURIComponent(title)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${t}`, '_blank', 'width=600,height=400')
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 font-medium">Сподели:</span>

      <button
        onClick={споделиФейсбук}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1877F2] text-white text-sm font-medium rounded-lg hover:bg-[#166FE5] transition-colors"
        aria-label="Сподели във Facebook"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook
      </button>

      <button
        onClick={копирайЛинк}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        aria-label="Копирай линка"
      >
        {копирано ? (
          <>
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-600">Копирано!</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Копирай линка
          </>
        )}
      </button>
    </div>
  )
}
