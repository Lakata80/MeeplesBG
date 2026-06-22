import type { Metadata } from 'next'
import Link              from 'next/link'

export const metadata: Metadata = {
  title: 'Политика за бисквитки',
  description:
    'Информация за бисквитките, използвани от MeeplesBG — видове, цел и как да управлявате предпочитанията си.',
}

const АКТУАЛИЗАЦИЯ = '15 юни 2026 г.'

export default function БисквиткиСтраница() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <Хедър
        заглавие="Политика за бисквитки"
        актуализация={АКТУАЛИЗАЦИЯ}
      />

      <Раздел заглавие="1. Какво са бисквитки?">
        <p>
          Бисквитките (cookies) са малки текстови файлове, които даден уебсайт
          запазва на вашето устройство при посещение. Те се използват широко за
          осигуряване на функционалности, запомняне на предпочитания и събиране на
          аналитична информация.
        </p>
        <p>
          Съгласно Закона за електронните съобщения и Директива 2009/136/ЕО
          („Директивата за бисквитките"), имате право да бъдете информирани за
          използваните бисквитки и да управлявате съгласието си.
        </p>
      </Раздел>

      <Раздел заглавие="2. Бисквитки, използвани от MeeplesBG">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Бисквитка</th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Цел</th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Категория</th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold">Срок</th>
              </tr>
            </thead>
            <tbody>
              {БИСКВИТКИ.map((б) => (
                <tr key={б.name} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 font-mono text-xs text-brand-700">{б.name}</td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-700">{б.цел}</td>
                  <td className="border border-gray-200 px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${б.badge}`}>
                      {б.категория}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-gray-600">{б.срок}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Раздел>

      <Раздел заглавие="3. Категории бисквитки">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              name:  'Задължителни',
              badge: 'bg-green-100 text-green-800',
              desc:  'Необходими за основните функции на сайта — вход, сигурност и запазване на предпочитания за бисквитки. Не могат да бъдат изключени.',
            },
            {
              name:  'Аналитични',
              badge: 'bg-brand-100 text-brand-800',
              desc:  'Помагат ни да разберем как посетителите използват сайта чрез събиране на анонимна информация. Могат да бъдат изключени.',
            },
            {
              name:  'Функционални',
              badge: 'bg-purple-100 text-purple-800',
              desc:  'Запомнят вашите предпочитания (език, тема) за по-добро потребителско изживяване. Могат да бъдат изключени.',
            },
            {
              name:  'Маркетингови',
              badge: 'bg-orange-100 text-orange-800',
              desc:  'Използват се за показване на персонализирано съдържание. В момента не използваме маркетингови бисквитки от трети страни.',
            },
          ].map(({ name, badge, desc }) => (
            <div key={name} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
                  {name}
                </span>
              </div>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </Раздел>

      <Раздел заглавие="4. Управление на предпочитанията">
        <p>
          При първото си посещение виждате банер за бисквитки, чрез който можете да
          изберете какви бисквитки да разрешите. Предпочитанията ви се запазват
          локално в браузъра ви за срок от 12 месеца.
        </p>
        <p>
          Освен това можете да управлявате или изтриете бисквитки директно от
          настройките на браузъра си:
        </p>
        <ul className="space-y-1.5 text-gray-700">
          {[
            ['Google Chrome', 'Настройки → Поверителност и сигурност → Бисквитки'],
            ['Mozilla Firefox', 'Настройки → Поверителност и сигурност → Бисквитки и данни на сайтове'],
            ['Safari', 'Настройки → Поверителност → Управление на данни за уебсайтове'],
            ['Microsoft Edge', 'Настройки → Бисквитки и разрешения за сайтове'],
          ].map(([браузър, път]) => (
            <li key={браузър} className="flex gap-2">
              <span className="mt-1 text-brand-500 flex-shrink-0">▸</span>
              <span>
                <strong>{браузър}:</strong> {път}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500">
          Забележка: блокирането на задължителните бисквитки може да наруши
          функционалността на Сайта.
        </p>
      </Раздел>

      <Раздел заглавие="5. Бисквитки от трети страни">
        <p>
          Някои бисквитки се поставят от трети страни (напр. Google Analytics).
          Тези страни имат собствени политики за поверителност, за които ние не
          носим отговорност. Препоръчваме ви да се запознаете с тях.
        </p>
      </Раздел>

      <Раздел заглавие="6. Промени в политиката">
        <p>
          Можем да актуализираме тази политика при промяна на използваните бисквитки.
          За съществени промени ще ви уведомим чрез банер на Сайта.
        </p>
      </Раздел>

      <Раздел заглавие="7. Контакт">
        <p>
          За въпроси относно бисквитките ни пишете на{' '}
          <a href="mailto:privacy@meeplesbg.com" className="text-brand-600 hover:underline">
            privacy@meeplesbg.com
          </a>{' '}
          или вижте нашата пълна{' '}
          <Link href="/gdpr" className="text-brand-600 hover:underline">
            Политика за защита на личните данни
          </Link>
          .
        </p>
      </Раздел>
    </main>
  )
}

// ── Данни ────────────────────────────────────────────────────────

const БИСКВИТКИ = [
  {
    name:      'next-auth.session-token',
    цел:       'Поддържа активна потребителска сесия след вход в сайта',
    категория: 'Задължителна',
    badge:     'bg-green-100 text-green-800',
    срок:      'Сесия / 30 дни',
  },
  {
    name:      '__Secure-next-auth.session-token',
    цел:       'Защитена версия на сесийната бисквитка (HTTPS)',
    категория: 'Задължителна',
    badge:     'bg-green-100 text-green-800',
    срок:      'Сесия / 30 дни',
  },
  {
    name:      'meeplebg-cookie-consent',
    цел:       'Запазва вашите предпочитания за бисквитки',
    категория: 'Задължителна',
    badge:     'bg-green-100 text-green-800',
    срок:      '12 месеца',
  },
  {
    name:      'next-auth.csrf-token',
    цел:       'Защита срещу CSRF атаки при вход',
    категория: 'Задължителна',
    badge:     'bg-green-100 text-green-800',
    срок:      'Сесия',
  },
  {
    name:      '_ga',
    цел:       'Google Analytics — разграничава потребителите',
    категория: 'Аналитична',
    badge:     'bg-brand-100 text-brand-800',
    срок:      '2 години',
  },
  {
    name:      '_ga_XXXXXXXX',
    цел:       'Google Analytics — запазва статуса на сесията',
    категория: 'Аналитична',
    badge:     'bg-brand-100 text-brand-800',
    срок:      '2 години',
  },
  {
    name:      'meeplebg-theme',
    цел:       'Запомня предпочитанията ви за тъмна/светла тема',
    категория: 'Функционална',
    badge:     'bg-purple-100 text-purple-800',
    срок:      '1 година',
  },
]

// ── Споделени компоненти ─────────────────────────────────────────

function Хедър({ заглавие, актуализация }: { заглавие: string; актуализация: string }) {
  return (
    <div className="mb-10">
      <p className="text-sm text-brand-600 font-medium mb-2">Правна информация</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{заглавие}</h1>
      <p className="text-sm text-gray-400">Последна актуализация: {актуализация}</p>
      <div className="mt-6 h-px bg-gray-200" />
    </div>
  )
}

function Раздел({ заглавие, children }: { заглавие: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{заглавие}</h2>
      <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  )
}
