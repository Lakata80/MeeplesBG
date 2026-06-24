import Link           from 'next/link'
import type { Metadata } from 'next'
import { prisma }     from '@/lib/prisma'
import { КАТЕГОРИИ, DB_КЪМ_SLUG, относителноВреме } from '@/lib/obshtnost'
import Image          from 'next/image'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title:       'Общност | MeeplesBG',
  description: 'Форум на MeeplesBG — помощ при избор, правила, пазар и игрални срещи.',
}

async function последниТеми(dbCat: string) {
  return prisma.thread.findMany({
    where:   { category: dbCat as 'IZBOR' | 'PRAVILA' | 'PAZAR' | 'SRESHTI' },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    take:    5,
    select: {
      id: true, slug: true, title: true, category: true,
      isSolved: true, isClosed: true, isPinned: true,
      updatedAt: true,
      author:    { select: { name: true, image: true } },
      _count:    { select: { replies: true } },
    },
  })
}

export default async function ОбщностСтраница() {
  const [izbor, pravila, pazar, sreshti] = await Promise.all([
    последниТеми('IZBOR'),
    последниТеми('PRAVILA'),
    последниТеми('PAZAR'),
    последниТеми('SRESHTI'),
  ])

  const данни = { izbor, pravila, pazar, sreshti }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎲 Общност</h1>
        <p className="text-gray-500 text-sm">Обсъждай, търси, продавай и играй с хора от цяла България.</p>
      </div>

      <div className="space-y-8">
        {(Object.values(КАТЕГОРИИ)).map((кат) => {
          const теми = данни[кат.slug as keyof typeof данни]
          return (
            <section key={кат.slug} className={`rounded-2xl border p-6 ${кат.color}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">{кат.icon} {кат.label}</h2>
                  <p className="text-sm opacity-75 mt-0.5">{кат.desc}</p>
                </div>
                <Link
                  href={`/obshtnost/${кат.slug}`}
                  className="text-sm font-semibold hover:underline shrink-0"
                >
                  Всички →
                </Link>
              </div>

              {теми.length === 0 ? (
                <p className="text-sm opacity-60 py-2">Все още няма теми. Бъди първи!</p>
              ) : (
                <ul className="space-y-2">
                  {теми.map((т) => (
                    <li key={т.id}>
                      <Link
                        href={`/obshtnost/${кат.slug}/${т.slug}`}
                        className="flex items-center gap-3 py-1.5 group"
                      >
                        <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 bg-white/50">
                          {т.author.image ? (
                            <Image src={т.author.image} alt="" fill className="object-cover" sizes="24px" />
                          ) : (
                            <span className="flex items-center justify-center w-full h-full text-xs font-bold opacity-60">
                              {(т.author.name ?? '?')[0]}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium group-hover:underline flex-1 min-w-0 truncate">
                          {т.isPinned && '📌 '}
                          {т.isSolved && '✓ '}
                          {т.title}
                        </span>
                        <span className="text-xs opacity-60 shrink-0">
                          {т._count.replies} отг. · {относителноВреме(т.updatedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 pt-4 border-t border-current/20">
                <Link
                  href={`/obshtnost/${кат.slug}?new=1`}
                  className="text-sm font-semibold hover:underline"
                >
                  + Нова тема
                </Link>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
