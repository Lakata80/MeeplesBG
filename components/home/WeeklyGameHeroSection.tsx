import Image from 'next/image'
import Link from 'next/link'
import { getActiveWeeklyGame } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import SearchBar from '@/components/ui/SearchBar'

export default async function WeeklyGameHeroSection() {
  let игра = null
  try {
    игра = await getActiveWeeklyGame()
  } catch {
    // Sanity недостъпен — показваме резервния hero
  }

  if (!игра) {
    return (
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.07] select-none pointer-events-none">
          <span className="absolute top-8 left-10 text-9xl">🎲</span>
          <span className="absolute bottom-8 right-12 text-7xl">♟️</span>
          <span className="absolute top-1/2 right-1/4 -translate-y-1/2 text-6xl">🃏</span>
        </div>
        <div className="relative container mx-auto px-4 py-16 md:py-20 text-center">
          <p className="text-brand-200 text-sm font-semibold uppercase tracking-widest mb-3">
            Местото за настолни игри
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
            Добре дошли в{' '}
            <span className="text-brand-200">MeeplesBG</span>
          </h1>
          <SearchBar
            className="max-w-xl mx-auto"
            размер="голям"
            placeholder="Търси игра по заглавие..."
          />
        </div>
      </section>
    )
  }

  const bannerUrl = игра.bannerImage
    ? urlFor(игра.bannerImage).width(1400).height(560).url()
    : null

  return (
    <section className="relative overflow-hidden min-h-[400px] md:min-h-[460px] flex items-end">
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt={игра.gameName}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/5" />

      <div className="relative w-full">
        <div className="container mx-auto px-4 pb-10 pt-32 md:pb-14">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
            🎲 Игра на седмицата
          </p>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-2 max-w-2xl">
            {игра.gameName}
          </h1>
          <p className="text-white/80 text-lg mb-6 max-w-xl">
            {игра.headlineBg}
          </p>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href={`/igri/igra-na-sedmicata/${игра.slug.current}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold rounded-xl transition-colors"
            >
              Виж повече →
            </Link>
            <Link
              href={`/igri/${игра.gameSlug}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl backdrop-blur-sm transition-colors border border-white/20"
            >
              Страницата на играта
            </Link>
            <Link
              href="/igri/igra-na-sedmicata"
              className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm font-medium rounded-xl backdrop-blur-sm transition-colors border border-white/15"
            >
              Игри на седмицата →
            </Link>
          </div>

          <SearchBar
            className="max-w-lg"
            размер="голям"
            placeholder="Търси игра по заглавие..."
          />
        </div>
      </div>
    </section>
  )
}
