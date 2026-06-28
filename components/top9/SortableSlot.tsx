'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export type SlotEntry = {
  id: string
  position: number
  playsCount: number | null
  game: {
    id: string
    titleBg: string
    titleEn: string | null
    thumbnailUrl: string | null
    slug: string
  }
}

export default function SortableSlot({
  entry,
  onRemove,
  onUpdatePlays,
  disabled,
}: {
  entry: SlotEntry
  onRemove: () => void
  onUpdatePlays: (plays: number | null) => void
  disabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id })

  const [editingPlays, setEditingPlays] = useState(false)
  const [playsValue, setPlaysValue] = useState(entry.playsCount?.toString() ?? '')

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.6 : 1,
  }

  function commitPlays() {
    setEditingPlays(false)
    const trimmed = playsValue.trim()
    const n = trimmed ? parseInt(trimmed, 10) : null
    if (n !== null && (isNaN(n) || n < 1)) {
      setPlaysValue(entry.playsCount?.toString() ?? '')
      return
    }
    if (n !== entry.playsCount) onUpdatePlays(n)
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, aspectRatio: '1 / 1' }}
      className="relative rounded-2xl border border-gray-200 bg-white overflow-hidden group select-none"
    >
      {/* Drag handle — whole card except interactive elements */}
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing"
        aria-label="Влачи за пренареждане"
      />

      {/* Game cover */}
      <div className="absolute inset-0">
        {entry.game.thumbnailUrl ? (
          <Image
            src={entry.game.thumbnailUrl}
            alt={entry.game.titleBg}
            fill
            sizes="(max-width: 640px) 33vw, 200px"
            className="object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-100 pointer-events-none">
            🎲
          </div>
        )}
      </div>

      {/* Position badge */}
      <div className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full bg-gold-500 flex items-center justify-center text-[10px] font-bold text-white pointer-events-none">
        {entry.position}
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        disabled={disabled}
        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/50 text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 flex items-center justify-center"
        aria-label="Премахни игра"
      >
        ✕
      </button>

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-2 pointer-events-none">
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">
          {entry.game.titleBg}
        </p>

        {editingPlays ? (
          <input
            type="number"
            value={playsValue}
            min={1}
            autoFocus
            onChange={(e) => setPlaysValue(e.target.value)}
            onBlur={commitPlays}
            onKeyDown={(e) => { if (e.key === 'Enter') commitPlays() }}
            onClick={(e) => e.stopPropagation()}
            className="pointer-events-auto mt-1 w-full text-[10px] bg-black/40 text-white border border-white/30 rounded px-1 py-0.5 focus:outline-none"
          />
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setPlaysValue(entry.playsCount?.toString() ?? ''); setEditingPlays(true) }}
            className="pointer-events-auto text-[10px] text-white/70 hover:text-white mt-1 cursor-pointer leading-tight"
          >
            {entry.playsCount ? `${entry.playsCount} изиграни игри` : '+ Добави брой изиграни игри'}
          </button>
        )}
      </div>
    </div>
  )
}
