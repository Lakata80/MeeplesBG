import Link from 'next/link'
import NewsletterForm from '@/components/newsletter/NewsletterForm'

const КОЛОНИ = [
  {
    заглавие: 'Игри',
    линкове: [
      { href: '/igri',                 label: 'Всички игри' },
      { href: '/mehaniki',             label: 'Механики' },
      { href: '/top/top-100',          label: 'Топ 100' },
      { href: '/igri?types=Strategy',  label: 'Стратегически' },
      { href: '/igri?types=Family',    label: 'Семейни' },
      { href: '/igri?types=Party',     label: 'Парти игри' },
    ],
  },
  {
    заглавие: 'Общност',
    линкове: [
      { href: '/top9',             label: '🏆 Top 9 на общността' },
      { href: '/novini',           label: 'Новини' },
      { href: '/obshtnost',        label: 'Общност' },
      { href: '/obshtnost/pazar',  label: 'Купувам / Продавам' },
      { href: '/obshtnost/sreshti', label: 'Игрални срещи' },
      { href: '/login',            label: 'Вход / Регистрация' },
    ],
  },
  {
    заглавие: 'Информация',
    линкове: [
      { href: '/kontakti',  label: 'Контакти' },
      { href: '/gdpr',      label: 'GDPR и Поверителност' },
      { href: '/pravila',   label: 'Правила за ползване' },
      { href: '/biskvitki', label: 'Политика за бисквитки' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Лого и описание */}
          <div>
            <Link href="/" className="text-xl font-bold text-white hover:text-brand-200 transition-colors">
              🎲 MeeplesBG
            </Link>
            <p className="mt-3 text-sm text-brand-300 leading-relaxed">
              Най-голямата онлайн общност за настолни игри в България. Открий, колекционирай и играй.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <SocialLink href="https://www.facebook.com/MeeplesBG/" label="Facebook">
                <FacebookIcon />
              </SocialLink>
              <SocialLink href="https://instagram.com/meeplesbg" label="Instagram">
                <InstagramIcon />
              </SocialLink>
              <SocialLink href="https://tiktok.com/@meeplesbg" label="TikTok">
                <TikTokIcon />
              </SocialLink>
            </div>
          </div>

          {/* Динамични колони */}
          {КОЛОНИ.map((колона) => (
            <div key={колона.заглавие}>
              <h3 className="text-sm font-semibold text-white mb-3">{колона.заглавие}</h3>
              <ul className="space-y-2">
                {колона.линкове.map((л) => (
                  <li key={л.href}>
                    <Link
                      href={л.href}
                      className="text-sm text-brand-300 hover:text-white transition-colors"
                    >
                      {л.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Бюлетин */}
        <div className="mt-10 pt-8 border-t border-brand-800">
          <div className="max-w-sm">
            <h3 className="text-sm font-semibold text-white mb-1">Бюлетин</h3>
            <p className="text-sm text-brand-300 mb-3">Седмичен дайджест с нови игри и новини.</p>
            <NewsletterForm вариант="компактен" />
          </div>
        </div>

        {/* Долна лента */}
        <div className="mt-10 pt-6 border-t border-brand-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-brand-400">
            © {new Date().getFullYear()} MeeplesBG. Всички права запазени.
          </p>
          <p className="text-xs text-brand-400">
            Данните за игрите са предоставени от{' '}
            <a
              href="https://boardgamegeek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-200 transition-colors"
            >
              BoardGameGeek
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-800 text-brand-300 hover:bg-white hover:text-brand-900 transition-colors"
    >
      {children}
    </a>
  )
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </svg>
  )
}
