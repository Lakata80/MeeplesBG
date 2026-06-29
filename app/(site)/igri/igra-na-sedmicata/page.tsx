import Image          from 'next/image'
import Link           from 'next/link'
import type { Metadata } from 'next'
import { getAllWeeklyGames } from '@/lib/sanity/queries'
import { urlFor }           from '@/lib/sanity/image'

export const revalidate = 3600

export const metadata: Metadata = {
  title:       'Игра на седмицата — Архив | MeeplesBG',
  description: 'Всички минали избори за Игра на седмицата в MeeplesBG.',
}

export default async function АрхивИграНаСедмицатаСтраница() {
  const записи = await getAllWeeklyGames().catch(() => [])

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">

      {/* Хлебни трохи */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/" className="hover:text-brand-600 transition-colors">Начало</Link>
        <span>›</span>
        <Link href="/igri/populiarni" className="hover:text-brand-600 transition-colors">Популярни игри</Link>
        <span>›</span>
        <span className="text-gray-700">Игра на седмицата</span>
      </nav>

      {/* Заглавие */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-gold-500/10 text-gold-600 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          🏆 Архив
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Игра на седмицата</h1>
        <p className="text-gray-500">
          {записи.length > 0
            ? `${записи.length} ${записи.length === 1 ? 'избор' : 'избора'} до момента`
            : 'Все още няма публикувани избори.'}
        </p>
      </div>

      {/* Празно състояние */}
      {записи.length === 0 && (
        <div className="py-20 text-center text-gray-400">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-lg font-medium text-gray-600 mb-2">Все още няма избори</p>
          <p className="text-sm">Първата игра на седмицата ще се появи скоро.</p>
        </div>
      )}

      {/* Решетка с карти */}
      {записи.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {записи.map((запис) => {
            const bannerUrl = запис.bannerImage
              ? urlFor(запис.bannerImage).width(800).height(450).fit('crop').url()
              : null

            return (
              <Link
                key={запис._id}
                href={`/igri/igra-na-sedmicata/${запис.slug.current}`}
                className="group block bg-white border border-[var(--border)] rounded-2xl overflow-hidden hover:shadow-md hover:border-brand-200 transition-all"
              >
                {/* Банер снимка */}
                <div className="relative aspect-[16/9] bg-brand-900 overflow-hidden">
                  {bannerUrl ? (
                    <Image
                      src={bannerUrl}
                      alt={запис.gameName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl text-brand-700">
                      🎲
                    </div>
                  )}

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Активен бадж */}
                  {запис.isActive && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 bg-gold-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shadow">
                      ✦ Тази седмица
                    </div>
                  )}

                  {/* Седмица overlay */}
                  {запис.weekLabel && (
                    <div className="absolute bottom-3 left-3 text-white/70 text-xs">
                      {запис.weekLabel}
                    </div>
                  )}
                </div>

                {/* Информация */}
                <div className="p-4">
                  <h2 className="font-bold text-gray-900 text-base mb-1 group-hover:text-brand-600 transition-colors">
                    {запис.gameName}
                  </h2>
                  {запис.headlineBg && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-snug">
                      {запис.headlineBg}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
