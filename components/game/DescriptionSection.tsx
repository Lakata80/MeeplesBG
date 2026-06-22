'use client'

import { useState } from 'react'

interface Props {
  descriptionBg?: string | null
  descriptionEn?: string | null
}

const ПРАГОВ_БРОЙ_СИМВОЛИ = 600

export default function DescriptionSection({ descriptionBg, descriptionEn }: Props) {
  const текст = descriptionBg || descriptionEn
  const [разширено, setРазширено] = useState(false)

  if (!текст) return null

  const дълъг = текст.length > ПРАГОВ_БРОЙ_СИМВОЛИ
  const показанТекст = дълъг && !разширено
    ? текст.slice(0, ПРАГОВ_БРОЙ_СИМВОЛИ) + '…'
    : текст

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Описание</h2>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed text-gray-700">
          {показанТекст.split('\n').map((параграф, индекс) =>
            параграф.trim() ? (
              <p key={индекс} className="mb-3">
                {параграф}
              </p>
            ) : null
          )}
        </div>

        {дълъг && (
          <button
            onClick={() => setРазширено((п) => !п)}
            className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
          >
            {разширено ? (
              <>
                <ChevronUp /> Скрий
              </>
            ) : (
              <>
                <ChevronDown /> Виж повече
              </>
            )}
          </button>
        )}

        {descriptionBg && descriptionEn && (
          <p className="mt-2 text-xs text-gray-400">Описанието е на английски — преводът предстои.</p>
        )}
        {!descriptionBg && descriptionEn && (
          <p className="mt-2 text-xs text-gray-400">
            Описанието е на английски — преводът предстои.
          </p>
        )}
      </div>
    </section>
  )
}

function ChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ChevronUp() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  )
}
