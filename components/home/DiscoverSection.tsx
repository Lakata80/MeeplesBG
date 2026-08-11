import Link from 'next/link'

const СЛУЧАИ = [
  { emoji: '👨‍👩‍👧‍👦', label: 'Семейство', href: '/igri?tip=Family' },
  { emoji: '👫',       label: 'Двама',      href: '/igri?igrali=2' },
  { emoji: '🎉',       label: 'Парти',      href: '/igri?tip=Party' },
  { emoji: '♟️',       label: 'Стратегия',  href: '/igri?tip=Strategy' },
  { emoji: '🤝',       label: 'Кооп.',      href: '/igri?tip=Cooperative' },
  { emoji: '👶',       label: 'Деца',       href: '/igri?vozrast=8' },
  { emoji: '⚔️',       label: 'Военни',     href: '/igri?tip=Wargame' },
]

export default function DiscoverSection() {
  return (
    <section className="py-14 bg-gray-50/60">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">🔎 Открий игра</h2>
          <p className="text-sm text-gray-500">Три начина да намериш следващата си любима игра</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-3xl mx-auto mb-8">
          <Link
            href="/igri/kviz"
            className="flex flex-col items-center text-center p-7 rounded-2xl bg-brand-50 border-2 border-brand-100 hover:border-brand-400 hover:bg-brand-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-4xl mb-3">🎯</span>
            <span className="font-bold text-gray-900 text-base mb-1">Квиз</span>
            <span className="text-xs text-gray-500">Отговори на въпроси и намери игра за теб</span>
          </Link>

          <Link
            href="/mehaniki"
            className="flex flex-col items-center text-center p-7 rounded-2xl bg-purple-50 border-2 border-purple-100 hover:border-purple-400 hover:bg-purple-100 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-4xl mb-3">⚙️</span>
            <span className="font-bold text-gray-900 text-base mb-1">По механика</span>
            <span className="text-xs text-gray-500">Deck Building, Worker Placement и много др.</span>
          </Link>

          <Link
            href="/igri"
            className="flex flex-col items-center text-center p-7 rounded-2xl bg-orange-50 border-2 border-orange-100 hover:border-orange-400 hover:bg-orange-100 transition-all hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 md:col-span-1"
          >
            <span className="text-4xl mb-3">🎉</span>
            <span className="font-bold text-gray-900 text-base mb-1">По повод</span>
            <span className="text-xs text-gray-500">Семейно, парти, двама, стратегия…</span>
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {СЛУЧАИ.map((с) => (
            <Link
              key={с.href}
              href={с.href}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-all"
            >
              <span>{с.emoji}</span>
              {с.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
