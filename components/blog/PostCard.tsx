import Link             from 'next/link'
import Image            from 'next/image'
import { urlFor }       from '@/lib/sanity/image'
import type { СтатияКарта, КатегорияСтатия } from '@/lib/sanity/queries'

// ── Категории ─────────────────────────────────────────────────

const КАТЕГОРИЯ_НАДПИС: Record<КатегорияСтатия, string> = {
  NEWS:   'Новини',
  REVIEW: 'Ревю',
  BLOG:   'Блог',
  GUIDE:  'Наръчник',
}

const КАТЕГОРИЯ_ЦВЯТ: Record<КатегорияСтатия, string> = {
  NEWS:   'bg-brand-100 text-brand-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  BLOG:   'bg-gray-100 text-gray-700',
  GUIDE:  'bg-green-100 text-green-700',
}

// ── Форматиране на дата ───────────────────────────────────────

const ФОРМАТ = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'long' })

function форматДата(iso: string): string {
  return ФОРМАТ.format(new Date(iso))
}

// ── Компонент ─────────────────────────────────────────────────

export default function PostCard({ статия }: { статия: СтатияКарта }) {
  const imageUrl = статия.mainImage
    ? urlFor(статия.mainImage).width(640).height(360).url()
    : null

  return (
    <Link
      href={`/novini/${статия.slug.current}`}
      className="group flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-brand-200 transition-all duration-200"
    >
      {/* Снимка */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={статия.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-200">
            📰
          </div>
        )}

        {/* Категория badge */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-full ${КАТЕГОРИЯ_ЦВЯТ[статия.category]}`}>
          {КАТЕГОРИЯ_НАДПИС[статия.category]}
        </span>
      </div>

      {/* Съдържание */}
      <div className="flex flex-col flex-1 p-5">
        <h2 className="text-base font-bold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-2 mb-2">
          {статия.title}
        </h2>

        {статия.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed flex-1 mb-4">
            {статия.excerpt}
          </p>
        )}

        {/* Автор и дата */}
        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
          {статия.author?.image && (
            <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
              <Image
                src={urlFor(статия.author.image).width(48).height(48).url()}
                alt={статия.author.name ?? ''}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
          )}
          <span className="text-xs text-gray-500">
            {статия.author?.name && (
              <span className="font-medium text-gray-700">{статия.author.name} · </span>
            )}
            {форматДата(статия.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  )
}
