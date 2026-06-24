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
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 tracking-tight">
          Всичко за настолни игри
          <br />
          <span className="text-brand-200">в България</span>
        </h1>

        <p className="text-xl md:text-2xl text-brand-100 mb-10 font-light">
          Открий, играй, сподели
        </p>

        {/* Голяма търсачка */}
        <SearchBar
          className="max-w-2xl mx-auto mb-8"
          размер="голям"
          placeholder="Търси игра по заглавие..."
          autoFocus
        />

        {/* CTA бутони */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/igri"
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors shadow-md text-sm"
          >
            Разгледай игрите
          </Link>
          <Link
            href="/novini"
            className="w-full sm:w-auto px-8 py-3.5 border-2 border-white/70 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-sm"
          >
            Новини и статии
          </Link>
        </div>

        {/* Бързи статистики */}
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
