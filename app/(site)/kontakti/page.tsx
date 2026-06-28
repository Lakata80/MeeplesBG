import type { Metadata } from 'next'
import Link              from 'next/link'
import ContactForm       from '@/components/kontakti/ContactForm'

export const metadata: Metadata = {
  title: 'Контакти',
  description:
    'Свържете се с екипа на MeeplesBG — въпроси, предложения, докладване на грешки и партньорства.',
}

export default function КонтактиСтраница() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-10">
        <p className="text-sm text-brand-600 font-medium mb-2">Свържете се с нас</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Контакти</h1>
        <p className="text-gray-500">
          Имате въпрос, предложение или забелязахте проблем? Пишете ни!
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">

        {/* Форма */}
        <ContactForm />

        {/* Sidebar с информация */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Информация за контакт</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="text-lg flex-shrink-0">📧</span>
                <div>
                  <p className="font-medium text-gray-900">Общи въпроси</p>
                  <a href="mailto:contact@meeplesbg.com" className="text-brand-600 hover:underline">
                    contact@meeplesbg.com
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-lg flex-shrink-0">🔒</span>
                <div>
                  <p className="font-medium text-gray-900">Поверителност / GDPR</p>
                  <a href="mailto:privacy@meeplesbg.com" className="text-brand-600 hover:underline">
                    privacy@meeplesbg.com
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-lg flex-shrink-0">⏱️</span>
                <div>
                  <p className="font-medium text-gray-900">Час на отговор</p>
                  <p>До 2 работни дни</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">📋 Правна информация</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/gdpr" className="text-brand-600 hover:underline">
                  Политика за поверителност (GDPR)
                </Link>
              </li>
              <li>
                <Link href="/biskvitki" className="text-brand-600 hover:underline">
                  Политика за бисквитки
                </Link>
              </li>
              <li>
                <Link href="/pravila" className="text-brand-600 hover:underline">
                  Правила за ползване
                </Link>
              </li>
            </ul>
          </div>
        </aside>

      </div>
    </main>
  )
}
