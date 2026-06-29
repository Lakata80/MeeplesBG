import Image from 'next/image'
import Link  from 'next/link'
import type { Metadata } from 'next'
import { getHotness } from '@/lib/bgg/hotness'
import { prisma }     from '@/lib/prisma'

export const metadata: Metadata = {
  title:       'Популярни игри тази седмица | MeeplesBG',
  description: 'Топ 50 най-горещи настолни игри според BGG Hotness. Вижте кои игри са в тренд тази седмица.',
}

export default async function PopuliarniPage() {
  let горещи = await getHotness().catch(() => [])

  if (горещи.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-400">
        <div className="text-5xl mb-4">🔥</div>
        <p className="text-lg font-medium text-gray-600">Списъкът не е достъпен в момента.</p>
        <p className="text-sm mt-1">Опитай отново след малко.</p>
      </div>
    )
  }

  const bggIds  = горещи.map((г) => г.id)
  const dbИгри  = await prisma.game.findMany({
    where:  { bggId: { in: bggIds }, isActive: true },
    select: { bggId: true, slug: true },
  })
  const slugMap = new Map(dbИгри.map((г) => [г.bggId, г.slug]))

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Заглавие */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/igri" className="text-sm text-brand-600 hover:text-brand-700 transition-colors">
            ← Всички игри
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">🔥 Популярни игри тази седмица</h1>
        <p className="text-sm text-gray-500 mt-1">
          Топ {горещи.length} игри според{' '}
          <a
            href="https://boardgamegeek.com/hotness"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline"
          >
            BGG Hotness
          </a>
        </p>
      </div>

      {/* Решетка */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {горещи.map((игра, индекс) => {
          const slug = slugMap.get(игра.id)
          const href = slug
            ? `/igri/${slug}`
            : `/igri?q=${encodeURIComponent(игра.name)}`

          return (
            <Link
              key={игра.id}
              href={href}
              className="group block bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-lg hover:border-brand-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Снимка */}
              <div className="relative aspect-square bg-[var(--background)] overflow-hidden">
                {игра.thumbnailUrl ? (
                  <Image
                    src={игра.thumbnailUrl}
                    alt={игра.name}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Ранк бадж */}
                <div className="absolute top-2 left-2 w-7 h-7 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                  {индекс + 1}
                </div>

                {/* Индикатор за липсваща страница */}
                {!slug && (
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-0.5 backdrop-blur-sm">
                    Скоро в MeeplesBG
                  </div>
                )}
              </div>

              {/* Информация */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors">
                  {игра.name}
                </h3>
                {игра.yearPublished && (
                  <p className="text-xs text-gray-400 mt-0.5">{игра.yearPublished}</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
