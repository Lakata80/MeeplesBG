import Image from 'next/image'
import Link from 'next/link'
import { formatPlaytime, formatPlayers, formatRating } from '@/lib/utils'

export interface GameCardProps {
  slug: string
  titleBg?: string | null
  titleEn?: string | null
  thumbnailUrl?: string | null
  imageUrl?: string | null
  yearPublished?: number | null
  minPlayers?: number | null
  maxPlayers?: number | null
  maxPlaytime?: number | null
  minAge?: number | null
  bggRating?: number | null
  weight?: number | null
  types?: string[]
}

export default function GameCard({
  slug,
  titleBg,
  titleEn,
  thumbnailUrl,
  imageUrl,
  yearPublished,
  minPlayers,
  maxPlayers,
  maxPlaytime,
  minAge,
  bggRating,
  weight,
  types = [],
}: GameCardProps) {
  const заглавие = titleBg || titleEn || 'Непозната игра'
  const снимка = thumbnailUrl || imageUrl

  return (
    <Link
      href={`/igri/${slug}`}
      className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200"
    >
      {/* Снимка */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        {снимка ? (
          <Image
            src={снимка}
            alt={заглавие}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <ImagePlaceholder />
          </div>
        )}

        {/* Рейтинг */}
        {bggRating != null && bggRating > 0 && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
            ★ {formatRating(bggRating)}
          </div>
        )}

        {/* Тип игра */}
        {types.length > 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
              {types[0]}
            </span>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
          {заглавие}
        </h3>

        {yearPublished && (
          <p className="text-xs text-gray-400 mt-0.5">{yearPublished}</p>
        )}

        {/* Мета данни */}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
          {(minPlayers != null || maxPlayers != null) && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <PlayersIcon />
              {formatPlayers(minPlayers ?? undefined, maxPlayers ?? undefined)}
            </span>
          )}
          {maxPlaytime != null && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <ClockIcon />
              {formatPlaytime(maxPlaytime)}
            </span>
          )}
          {minAge != null && (
            <span className="text-xs text-gray-500">{minAge}+</span>
          )}
        </div>

        {/* Сложност */}
        {weight != null && weight > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${(weight / 5) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
              {weight.toFixed(1)}/5
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

function ImagePlaceholder() {
  return (
    <svg
      className="w-12 h-12"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}

function PlayersIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" />
      <path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  )
}
