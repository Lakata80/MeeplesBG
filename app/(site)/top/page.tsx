import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { КАТЕГОРИИ_КЛАСАЦИИ, getRanking } from '@/lib/rankings'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title:       'Топ класации | MeeplesBG',
  description: 'Разгледай топ 100 списъците на MeeplesBG — стратегии, семейни, кооперативни и още.',
  openGraph: {
    title:       'Топ класации | MeeplesBG',
    description: 'Разгледай топ 100 списъците на MeeplesBG — стратегии, семейни, кооперативни и още.',
  },
}

export default async function TopPage() {
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
          <div
            key={кат.slug}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col"
          >
            <div className="p-6 flex flex-col flex-1">

              {/* Икона + заглавие + описание */}
              <div className="flex items-start gap-3 mb-5">
                <span className="text-3xl leading-none mt-0.5" aria-hidden>
                  {кат.икона}
                </span>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {кат.заглавие}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {кат.описание}
                  </p>
                </div>
              </div>

              {/* Топ 3 миниатюри — всяка води до страницата на играта */}
              {кат.топ3.length > 0 && (
                <div className="flex gap-3 mb-5">
                  {кат.топ3.map((игра, i) => {
                    const снимка = игра.thumbnailUrl ?? игра.imageUrl
                    const медали = ['🥇', '🥈', '🥉']
                    return (
                      <Link
                        key={игра.id}
                        href={`/igri/${игра.slug}`}
                        className="flex-1 min-w-0 group/game"
                        title={игра.titleBg || игра.titleEn || ''}
                      >
                        <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                          {снимка ? (
                            <Image
                              src={снимка}
                              alt={игра.titleBg || игра.titleEn || ''}
                              fill
                              className="object-contain p-1 group-hover/game:scale-105 transition-transform duration-200"
                              sizes="80px"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-200">
                              🎲
                            </div>
                          )}
                          <span
                            className="absolute top-1 left-1 text-xs leading-none drop-shadow-sm"
                            aria-label={`Позиция ${i + 1}`}
                          >
                            {медали[i]}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 text-center truncate leading-tight">
                          {игра.titleBg || игра.titleEn}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* CTA — само той води до класацията */}
              <div className="mt-auto">
                <Link
                  href={`/top/${кат.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:gap-2 transition-all"
                >
                  Виж класацията
                  <span aria-hidden>→</span>
                </Link>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
