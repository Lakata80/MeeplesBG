import Link from 'next/link'
import NewsletterForm from '@/components/newsletter/NewsletterForm'

const КОЛОНИ = [
  {
    заглавие: 'Игри',
    линкове: [
      { href: '/игри',                 label: 'Всички игри' },
      { href: '/top/top-100',          label: 'Топ 100' },
      { href: '/игри?types=Strategy',  label: 'Стратегически' },
      { href: '/игри?types=Family',    label: 'Семейни' },
      { href: '/игри?types=Party',     label: 'Парти игри' },
    ],
  },
  {
    заглавие: 'Общност',
    линкове: [
      { href: '/novini',  label: 'Новини' },
      { href: '/forum',   label: 'Форум' },
      { href: '/top',     label: 'Топ класации' },
      { href: '/вход',    label: 'Влез / Регистрирай се' },
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
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Лого и описание */}
          <div>
            <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
              🎲 MeeplesBG
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Най-голямата онлайн общност за настолни игри в България. Открий, колекционирай и играй.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <SocialLink href="https://facebook.com" label="Facebook">
                <FacebookIcon />
              </SocialLink>
            </div>
          </div>

          {/* Динамични колони */}
          {КОЛОНИ.map((колона) => (
            <div key={колона.заглавие}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{колона.заглавие}</h3>
              <ul className="space-y-2">
                {колона.линкове.map((л) => (
                  <li key={л.href}>
                    <Link
                      href={л.href}
                      className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
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
        <div className="mt-10 pt-8 border-t border-gray-200">
          <div className="max-w-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Бюлетин</h3>
            <p className="text-sm text-gray-500 mb-3">Седмичен дайджест с нови игри и новини.</p>
            <NewsletterForm вариант="компактен" />
          </div>
        </div>

        {/* Долна лента */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} MeeplesBG. Всички права запазени.
          </p>
          <p className="text-xs text-gray-400">
            Данните за игрите са предоставени от{' '}
            <a
              href="https://boardgamegeek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
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
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 text-gray-500 hover:bg-blue-600 hover:text-white transition-colors"
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
