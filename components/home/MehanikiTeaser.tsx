import Link  from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'

const МЕХАНИКИ_КОНФИГ = [
  {
    name:     'Deck, Bag, and Pool Building',
    икона:    '📚',
    заглавие: 'Строене на тесте',
    описание: 'Изграждай мощна колода от нулата и оптимизирай всеки ход',
  },
  {
    name:     'Worker Placement',
    икона:    '👷',
    заглавие: 'Разполагане на работници',
    описание: 'Прати работниците на работа — само ти решаваш кой където отива',
  },
  {
    name:     'Dice Rolling',
    икона:    '🎲',
    заглавие: 'Хвърляне на зарове',
    описание: 'Лесно за учене, вълнуващо до края — всяко хвърляне може да промени играта',
  },
  {
    name:     'Set Collection',
    икона:    '🃏',
    заглавие: 'Събиране на колекции',
    описание: 'Събирай съвпадащи карти и елементи, за да натрупаш победни точки',
  },
] as const

export default async function MehanikiTeaser() {
  const данни = await Promise.all(
    МЕХАНИКИ_КОНФИГ.map(async (к) => {
      const [механика, игри] = await Promise.all([
        prisma.mechanic.findFirst({
          where:  { name: к.name },
          select: { slug: true },
        }),
        prisma.game.findMany({
          where:   { isActive: true, mechanics: { has: к.name }, baseGameId: null },
          orderBy: [
            { bggRank:   { sort: 'asc',  nulls: 'last' } },
            { bggRating: { sort: 'desc', nulls: 'last' } },
          ],
          take:    3,
          select:  { id: true, slug: true, titleBg: true, titleEn: true, thumbnailUrl: true, imageUrl: true },
        }),
      ])
      return { ...к, mechanicSlug: механика?.slug ?? null, игри }
    })
  )

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">

        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🔎 Изследвай игрите по механика</h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            Механиките са „правилата на играта" — научи как работят и открий игри, в които те блестят
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {данни.map((к) => (
            <div
              key={к.name}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col hover:border-brand-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl leading-none">{к.икона}</span>
                <h3 className="font-bold text-gray-900">{к.заглавие}</h3>
              </div>

              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{к.описание}</p>

              {к.игри.length > 0 && (
                <div className="flex gap-2 mb-5">
                  {к.игри.map((игра) => {
                    const снимка = игра.thumbnailUrl ?? игра.imageUrl
                    return (
                      <Link
                        key={игра.id}
                        href={`/igri/${игра.slug}`}
                        className="flex-1 min-w-0 group/game"
                        title={игра.titleBg || игра.titleEn || ''}
                      >
                        <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
                          {снимка ? (
                            <Image
                              src={снимка}
                              alt={игра.titleBg || игра.titleEn || ''}
                              fill
                              className="object-contain p-1 group-hover/game:scale-105 transition-transform duration-200"
                              sizes="120px"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xl text-gray-300">
                              🎲
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 text-center truncate leading-tight">
                          {игра.titleBg || игра.titleEn}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              )}

              {к.mechanicSlug && (
                <Link
                  href={`/mehaniki/${к.mechanicSlug}`}
                  className="mt-auto inline-flex items-center justify-center gap-1 w-full py-2 rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition-colors"
                >
                  Разгледай →
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/mehaniki"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Виж всички механики →
          </Link>
        </div>

      </div>
    </section>
  )
}
