import { Suspense }      from 'react'
import Link              from 'next/link'
import Image             from 'next/image'
import type { Metadata } from 'next'
import { auth }          from '@/auth'
import { prisma }        from '@/lib/prisma'
import {
  КАТЕГОРИИ,
  относителноВреме,
  type ThreadCategorySlug,
} from '@/lib/obshtnost'
import ThreadCard, { type ThreadCardData } from '@/components/obshtnost/ThreadCard'
import Pagination        from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title:       'Общност | MeeplesBG',
  description: 'Форум на MeeplesBG — помощ при избор, правила, пазар и игрални срещи.',
}

type SearchParams = Promise<Record<string, string | undefined>>

const НА_СТРАНИЦА = 20

const ТАБОВЕ = [
  { надпис: 'Всички',                       kat: '' },
  { надпис: '🤔 Помощ при избор',            kat: 'izbor' },
  { надпис: '🛒 Купувам / Продавам',         kat: 'pazar' },
  { надпис: '📅 Календар на събития',         kat: 'sreshti' },
  { надпис: '📖 Правила и стратегии',        kat: 'pravila' },
]

function tabHref(kat: string, stranica = 1): string {
  const p = new URLSearchParams()
  if (kat) p.set('kat', kat)
  if (stranica > 1) p.set('stranica', String(stranica))
  const q = p.toString()
  return q ? `/obshtnost?${q}` : '/obshtnost'
}

function TabBar({ activeKat }: { activeKat: string }) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
      {ТАБОВЕ.map((т) => {
        const активен = т.kat === activeKat
        return (
          <Link
            key={т.kat}
            href={tabHref(т.kat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              активен
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {т.надпис}
          </Link>
        )
      })}
    </div>
  )
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

export default async function ОбщностСтраница({ searchParams }: { searchParams: SearchParams }) {
  const sp       = await searchParams
  const kat      = typeof sp.kat === 'string' ? sp.kat : ''
  const страница = Math.max(1, parseInt(sp.stranica ?? '1') || 1)

  const кат = kat ? (КАТЕГОРИИ[kat as ThreadCategorySlug] ?? null) : null

  // ── Таб с конкретна категория ─────────────────────────────────
  if (кат) {
    const offset = (страница - 1) * НА_СТРАНИЦА

    const [session, теми, общо] = await Promise.all([
      auth(),
      prisma.thread.findMany({
        where:   { category: кат.db as 'IZBOR' | 'PRAVILA' | 'PAZAR' | 'SRESHTI' },
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        skip:    offset,
        take:    НА_СТРАНИЦА,
        select: {
          id: true, slug: true, title: true, category: true,
          isSolved: true, isClosed: true, isPinned: true,
          price: true, expiresAt: true,
          eventDate: true, eventCity: true, eventClub: true,
          createdAt: true, updatedAt: true,
          author: { select: { name: true, image: true } },
          _count: { select: { replies: true } },
        },
      }),
      prisma.thread.count({
        where: { category: кат.db as 'IZBOR' | 'PRAVILA' | 'PAZAR' | 'SRESHTI' },
      }),
    ])

    const общоСтраници = Math.max(1, Math.ceil(общо / НА_СТРАНИЦА))

    return (
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🎲 Общност</h1>
          <p className="text-gray-500 text-sm">Обсъждай, търси, продавай и играй с хора от цяла България.</p>
        </div>

        <TabBar activeKat={kat} />

        {/* Банер за квиз — само в "Помощ при избор" */}
        {кат.db === 'IZBOR' && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-blue-800">🎲 Не знаеш коя игра да купиш?</p>
              <p className="text-xs text-blue-600 mt-0.5">Отговори на 5 въпроса и ние ще ти препоръчаме игри.</p>
            </div>
            <Link
              href="/igri/kviz"
              className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Намери игра →
            </Link>
          </div>
        )}

        {/* Хедър на категорията */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{кат.icon} {кат.label}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{кат.desc}</p>
          </div>
          {session ? (
            <Link
              href={`/obshtnost/${кат.slug}?new=1`}
              className="shrink-0 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
            >
              + {кат.db === 'PAZAR' ? 'Нова обява' : 'Нова тема'}
            </Link>
          ) : (
            <Link href="/login" className="shrink-0 text-sm text-brand-600 font-medium hover:underline">
              Влез за да публикуваш
            </Link>
          )}
        </div>

        {/* Списък с теми */}
        {теми.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">{кат.icon}</div>
            <p className="text-gray-600 font-medium mb-1">{кат.db === 'PAZAR' ? 'Няма нови обяви' : 'Все още няма теми'}</p>
            <p className="text-sm">{кат.db === 'PAZAR' ? 'Бъди първи — публикувай нова обява!' : 'Бъди първи — публикувай нова тема!'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {теми.map((т) => (
              <ThreadCard key={т.id} thread={т as ThreadCardData} categorySlug={кат.slug} />
            ))}
          </div>
        )}

        {/* Пагинация */}
        {общоСтраници > 1 && (
          <div className="mt-8">
            <Suspense fallback={null}>
              <Pagination текущаСтраница={страница} общоСтраници={общоСтраници} />
            </Suspense>
          </div>
        )}
      </div>
    )
  }

  // ── Таб "Всички" — дашборд ────────────────────────────────────
  const [izbor, pravila, pazar, sreshti] = await Promise.all([
    последниТеми('IZBOR'),
    последниТеми('PRAVILA'),
    последниТеми('PAZAR'),
    последниТеми('SRESHTI'),
  ])

  const данни = { izbor, pravila, pazar, sreshti }

  // Редът на категориите в дашборда е зададен от таба
  const редКатегории: ThreadCategorySlug[] = ['izbor', 'pazar', 'sreshti', 'pravila']

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🎲 Общност</h1>
        <p className="text-gray-500 text-sm">Обсъждай, търси, продавай и играй с хора от цяла България.</p>
      </div>

      <TabBar activeKat="" />

      <div className="space-y-8">
        {редКатегории.map((slug) => {
          const кат  = КАТЕГОРИИ[slug]
          const теми = данни[slug]
          return (
            <section key={кат.slug} className={`rounded-2xl border p-6 ${кат.color}`}>
              {/* Банер за квиз в секция "Помощ при избор" */}
              {кат.db === 'IZBOR' && (
                <div className="mb-4 flex items-center justify-between gap-3 bg-white/60 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-blue-800">🎲 Не знаеш коя игра да купиш? Отговори на 5 въпроса.</p>
                  <Link
                    href="/igri/kviz"
                    className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Намери игра →
                  </Link>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">{кат.icon} {кат.label}</h2>
                  <p className="text-sm opacity-75 mt-0.5">{кат.desc}</p>
                </div>
                <Link
                  href={tabHref(кат.slug)}
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
