import Link from 'next/link'
import { getRanking } from '@/lib/rankings'

const КАРТИ = [
  {
    slug:    'top-100',
    икона:   '🏆',
    заглавие: 'Топ 100',
    описание: 'Най-добрите игри според общността',
    играчи:  '2–6 играчи',
    бутон:   'Виж класацията',
  },
  {
    slug:    'top-semeyni',
    икона:   '👨‍👩‍👧',
    заглавие: 'Семейни игри',
    описание: 'Любими игри за цялото семейство',
    играчи:  '2–5 играчи',
    бутон:   'Разгледай',
  },
  {
    slug:    'top-kooperativni',
    икона:   '🤝',
    заглавие: 'Кооперативни',
    описание: 'Работете заедно срещу играта',
    играчи:  '1–5 играчи',
    бутон:   'Разгледай',
  },
  {
    slug:    'top-za-dvama',
    икона:   '👥',
    заглавие: 'За двама',
    описание: 'Най-добрите игри за двама играчи',
    играчи:  '2 играчи',
    бутон:   'Разгледай',
  },
]

export default async function BestsellersSection() {
  const данни = await Promise.all(
    КАРТИ.map(async (к) => ({
      ...к,
      игри: (await getRanking(к.slug, 3)) ?? [],
    }))
  )

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">

        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Най-добрите настолни игри</h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            Открий най-високо оценените игри според милиони играчи по света — данните са от{' '}
            <a
              href="https://boardgamegeek.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              BoardGameGeek
            </a>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {данни.map((к) => (
            <div
              key={к.slug}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col hover:border-brand-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl leading-none">{к.икона}</span>
                <h3 className="font-bold text-gray-900">{к.заглавие}</h3>
              </div>

              <p className="text-xs text-gray-500 mb-4">{к.описание}</p>

              <div className="mb-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Най-подходящи за
                </p>
                <p className="text-sm text-gray-700 font-medium">{к.играчи}</p>
              </div>

              {к.игри.length > 0 && (
                <div className="mb-5 flex-1">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Популярни
                  </p>
                  <ul className="space-y-1.5">
                    {к.игри.map((игра) => (
                      <li key={игра.id}>
                        <Link
                          href={`/igri/${игра.slug}`}
                          className="text-sm text-gray-700 hover:text-brand-600 truncate block transition-colors"
                        >
                          {игра.titleBg || игра.titleEn}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                href={`/top/${к.slug}`}
                className="mt-auto inline-flex items-center justify-center gap-1 w-full py-2 rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition-colors"
              >
                {к.бутон} →
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
