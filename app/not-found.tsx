import Link      from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Страницата не е намерена',
  description: 'Страницата, която търсите, не съществува в MeeplesBG.',
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center py-20">

        <p className="text-9xl font-black text-brand-600 leading-none select-none mb-2">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Страницата не е намерена</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Страницата, която търсите, не съществува или е преместена.
          Проверете дали сте написали правилно адреса.
        </p>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            ← Начало
          </Link>
          <Link
            href="/igri"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            🎲 Всички игри
          </Link>
          <Link
            href="/top/top-100"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            🏆 Топ 100
          </Link>
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Популярни раздели
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {([
              { href: '/novini',   label: '📰 Новини' },
              { href: '/top',      label: '📊 Класации' },
              { href: '/forum',    label: '💬 Форум' },
              { href: '/kontakti', label: '✉️ Контакти' },
            ] as const).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-brand-600 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
