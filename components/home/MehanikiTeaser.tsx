import Link from 'next/link'

const ПОПУЛЯРНИ = [
  { label: 'Hand Management',       slug: 'hand-management' },
  { label: 'Variable Player Powers', slug: 'variable-player-powers' },
  { label: 'Dice Rolling',          slug: 'dice-rolling' },
  { label: 'Solo / Solitaire Game', slug: 'solo-solitaire-game' },
  { label: 'Open Drafting',         slug: 'open-drafting' },
  { label: 'Set Collection',        slug: 'set-collection' },
]

export default function MehanikiTeaser() {
  return (
    <section className="py-10 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="bg-brand-50 border border-brand-100 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">

          <div className="flex-1">
            <h2 className="text-base font-bold text-brand-800 mb-3">
              🔎 Изследвай игрите по механика
            </h2>
            <div className="flex flex-wrap gap-2">
              {ПОПУЛЯРНИ.map((м) => (
                <Link
                  key={м.slug}
                  href={`/mehaniki/${м.slug}`}
                  className="px-3 py-1.5 bg-white border border-brand-200 rounded-lg text-sm font-medium text-brand-700 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-colors shadow-sm"
                >
                  {м.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/mehaniki"
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors whitespace-nowrap"
          >
            Виж всички механики
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

        </div>
      </div>
    </section>
  )
}
