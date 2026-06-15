import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { КАТЕГОРИИ_КЛАСАЦИИ, getRanking } from '@/lib/rankings'

export const revalidate = 86400

export const metadata: Metadata = {
  title:       'Топ класации | MeeplesBG',
  description: 'Разгледай топ 100 списъците на MeeplesBG — стратегии, семейни, кооперативни и още.',
  openGraph: {
    title:       'Топ класации | MeeplesBG',
    description: 'Разгледай топ 100 списъците на MeeplesBG — стратегии, семейни, кооперативни и още.',
  },
}

export default async function TopPage() {
  // Зареждаме топ 3 за всяка категория паралелно
  const данни = await Promise.all(
    КАТЕГОРИИ_КЛАСАЦИИ.map(async (кат) => ({
      ...кат,
      топ3: (await getRanking(кат.slug, 3)) ?? [],
    })),
  )

  return (
    <div className="container mx-auto px-4 py-10">

      {/* Заглавие */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Топ класации</h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
          Открий най-добрите настолни игри в различни категории,
          подредени по оценка от BoardGameGeek.
        </p>
      </div>

      {/* Мрежа от 6 карти */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {данни.map((кат) => (
          <Link
            key={кат.slug}
            href={`/top/${кат.slug}`}
            className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200"
          >
            {/* Икона + заглавие + описание */}
            <div className="flex items-start gap-3 mb-5">
              <span className="text-3xl leading-none mt-0.5" aria-hidden>
                {кат.икона}
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {кат.заглавие}
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {кат.описание}
                </p>
              </div>
            </div>

            {/* Топ 3 миниатюри */}
            {кат.топ3.length > 0 && (
              <div className="flex gap-2 mb-4">
                {кат.топ3.map((игра, i) => {
                  const снимка = игра.thumbnailUrl ?? игра.imageUrl
                  const медали = ['🥇', '🥈', '🥉']
                  return (
                    <div key={игра.id} className="relative flex-1">
                      <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        {снимка ? (
                          <Image
                            src={снимка}
                            alt={игра.titleBg || игра.titleEn || ''}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="80px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-200">
                            🎲
                          </div>
                        )}
                        <span
                          className="absolute top-1 left-1 text-sm leading-none drop-shadow"
                          aria-label={`Позиция ${i + 1}`}
                        >
                          {медали[i]}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 text-center truncate leading-tight">
                        {игра.titleBg || игра.titleEn}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* CTA */}
            <div className="flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:gap-2 transition-all">
              Виж класацията
              <span aria-hidden>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
