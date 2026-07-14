import Link from 'next/link'
import SearchBar from '@/components/ui/SearchBar'

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white overflow-hidden">
      {/* Декоративен фон */}
      <div aria-hidden className="absolute inset-0 opacity-[0.07] select-none pointer-events-none">
        <span className="absolute top-8 left-10 text-9xl">🎲</span>
        <span className="absolute bottom-8 right-12 text-7xl">♟️</span>
        <span className="absolute top-1/2 right-1/4 -translate-y-1/2 text-6xl">🃏</span>
        <span className="absolute top-16 right-16 text-5xl">🎯</span>
      </div>

      <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-10 tracking-tight">
          Намери следващата си
          <br />
          <span className="text-brand-200">любима настолна игра</span>
        </h1>

        {/* Куиз CTA */}
        <Link
          href="/igri/kviz"
          className="inline-flex items-center gap-3 px-8 py-4 bg-white text-brand-700 font-bold text-lg rounded-2xl hover:bg-brand-50 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform transition-all"
        >
          🎲 Направи куиза
          <span className="text-brand-400">→</span>
        </Link>

        {/* Разделител */}
        <div className="flex items-center gap-4 my-6 max-w-sm mx-auto">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-brand-200 text-sm font-medium">или</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Търсачка */}
        <SearchBar
          className="max-w-xl mx-auto"
          размер="голям"
          placeholder="Търси игра по заглавие..."
        />

        {/* Статистики */}
        <div className="flex flex-wrap justify-center gap-8 mt-14 text-brand-100">
          <Стат число="2 000+" текст="игри в базата" />
          <Стат число="100%" текст="на български" />
          <Стат число="Безплатно" текст="за всички" />
        </div>
      </div>
    </section>
  )
}

function Стат({ число, текст }: { число: string; текст: string }) {
  return (
    <div className="text-center">
      <span className="block text-2xl font-bold text-white">{число}</span>
      <span className="text-sm">{текст}</span>
    </div>
  )
}
