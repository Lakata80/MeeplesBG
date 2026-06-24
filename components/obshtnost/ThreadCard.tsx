import Link from 'next/link'
import Image from 'next/image'
import { относителноВреме, type ThreadCategorySlug } from '@/lib/obshtnost'

export interface ThreadCardData {
  id:          string
  slug:        string
  title:       string
  category:    string
  isSolved:    boolean
  isClosed:    boolean
  isPinned:    boolean
  price?:      string | null
  expiresAt?:  Date | null
  eventDate?:  Date | null
  eventCity?:  string | null
  eventClub?:  string | null
  createdAt:   Date
  updatedAt:   Date
  author: {
    name:  string | null
    image: string | null
  }
  _count: { replies: number }
}

interface Props {
  thread:       ThreadCardData
  categorySlug: ThreadCategorySlug
}

const ДАТА = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium' })

export default function ThreadCard({ thread, categorySlug }: Props) {
  const href = `/obshtnost/${categorySlug}/${thread.slug}`

  return (
    <Link
      href={href}
      className="group block bg-white border border-gray-200 rounded-2xl px-5 py-4 hover:border-brand-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Автор аватар */}
        <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-200 mt-0.5">
          {thread.author.image ? (
            <Image src={thread.author.image} alt={thread.author.name ?? ''} fill className="object-cover" sizes="36px" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-sm font-bold text-gray-500">
              {(thread.author.name ?? '?')[0].toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Заглавие + значки */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {thread.isPinned && (
              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">📌 Закачена</span>
            )}
            {thread.isSolved && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Решена</span>
            )}
            {thread.isClosed && (
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">🔒 Затворена</span>
            )}
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors leading-snug">
              {thread.title}
            </h3>
          </div>

          {/* Мета информация */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
            <span>{thread.author.name ?? 'Анонимен'}</span>
            <span>·</span>
            <span>{относителноВреме(thread.updatedAt)}</span>
            <span>·</span>
            <span>{thread._count.replies} {thread._count.replies === 1 ? 'отговор' : 'отговора'}</span>

            {/* PAZAR — цена */}
            {thread.price && (
              <>
                <span>·</span>
                <span className="font-medium text-green-700">{thread.price}</span>
              </>
            )}
            {thread.expiresAt && new Date(thread.expiresAt) > new Date() && (
              <>
                <span>·</span>
                <span className="text-orange-500">изтича {ДАТА.format(new Date(thread.expiresAt))}</span>
              </>
            )}

            {/* SRESHTI — дата и град */}
            {thread.eventDate && (
              <>
                <span>·</span>
                <span className="font-medium text-orange-700">📅 {ДАТА.format(new Date(thread.eventDate))}</span>
              </>
            )}
            {thread.eventCity && (
              <>
                <span>·</span>
                <span>📍 {thread.eventCity}</span>
              </>
            )}
            {thread.eventClub && (
              <>
                <span>·</span>
                <span>🏛️ {thread.eventClub}</span>
              </>
            )}
          </div>
        </div>

        <span className="text-gray-300 group-hover:text-brand-400 transition-colors text-lg shrink-0">→</span>
      </div>
    </Link>
  )
}
