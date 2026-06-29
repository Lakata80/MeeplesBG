import { Suspense }      from 'react'
import Link              from 'next/link'
import Image             from 'next/image'
import type { Metadata } from 'next'
import { auth }          from '@/auth'
import { prisma }        from '@/lib/prisma'
import {
  КАТЕГОРИИ,
  EVENT_TYPES,
  DB_КЪМ_SLUG,
  относителноВреме,
  type ThreadCategorySlug,
  type EventTypeName,
} from '@/lib/obshtnost'
import ThreadCard, { type ThreadCardData } from '@/components/obshtnost/ThreadCard'
import Pagination        from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title:       'Общност | MeeplesBG',
  description: 'Свържи се с други любители на настолни игри, намери играчи, обсъждай правила и откривай събития.',
}

type SearchParams = Promise<Record<string, string | undefined>>

const НА_СТРАНИЦА = 20

const ТАБОВЕ = [
  { надпис: 'Всички',                 kat: '',        href: '/obshtnost' },
  { надпис: '🤔 Помощ при избор',     kat: 'izbor',   href: '/obshtnost?kat=izbor' },
  { надпис: '🛒 Купувам / Продавам',  kat: 'pazar',   href: '/obshtnost?kat=pazar' },
  { надпис: '📅 Календар на събития', kat: 'sreshti', href: '/obshtnost/sreshti' },
  { надпис: '📖 Правила и стратегии', kat: 'pravila', href: '/obshtnost?kat=pravila' },
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
    <div className="flex gap-2 mb-8 border-b border-gray-200 pb-4 overflow-x-auto overflow-y-hidden">
      {ТАБОВЕ.map((т) => {
        const активен = т.kat === activeKat
        return (
          <Link
            key={т.kat}
            href={т.href}
            className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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

// ── Dashboard card configs ────────────────────────────────────

const КАРТИ = [
  {
    href:     '/igri/kviz',
    emoji:    '🎲',
    title:    'Помогни ми да избера игра',
    desc:     'Отговори на 5 въпроса и ще ти препоръчаме настолни игри по мярка.',
    grad:     'from-blue-50 to-indigo-50',
    border:   'border-blue-100 hover:border-blue-300',
    icon:     'bg-blue-100',
    link:     'text-blue-700',
    linkText: 'Стартирай квиза',
  },
  {
    href:     '/obshtnost/sreshti',
    emoji:    '🤝',
    title:    'Търся играчи',
    desc:     'Намери хора за игра, присъедини се към група или виж предстоящи срещи и турнири.',
    grad:     'from-orange-50 to-amber-50',
    border:   'border-orange-100 hover:border-orange-300',
    icon:     'bg-orange-100',
    link:     'text-orange-700',
    linkText: 'Виж събитията',
  },
  {
    href:     '/obshtnost/pazar',
    emoji:    '🛒',
    title:    'Купувам / Продавам',
    desc:     'Обяви за настолни игри — купи, продай или размени с друг играч.',
    grad:     'from-green-50 to-emerald-50',
    border:   'border-green-100 hover:border-green-300',
    icon:     'bg-green-100',
    link:     'text-green-700',
    linkText: 'Виж обявите',
  },
  {
    href:     '/obshtnost/pravila',
    emoji:    '📖',
    title:    'Правила и стратегии',
    desc:     'Задавай въпроси за правила, обсъждай стратегии и тактики с опитни играчи.',
    grad:     'from-purple-50 to-violet-50',
    border:   'border-purple-100 hover:border-purple-300',
    icon:     'bg-purple-100',
    link:     'text-purple-700',
    linkText: 'Виж разговорите',
  },
  {
    href:     '/obshtnost/igraeniya',
    emoji:    '🎮',
    title:    'Дневник на общността',
    desc:     'Виж какво играят другите — публични записи от изиграни партии.',
    grad:     'from-teal-50 to-cyan-50',
    border:   'border-teal-100 hover:border-teal-300',
    icon:     'bg-teal-100',
    link:     'text-teal-700',
    linkText: 'Виж играниите',
  },
]

const КАТ_BADGE: Record<string, string> = {
  IZBOR:   '🤔 Помощ при избор',
  PRAVILA: '📖 Правила',
  PAZAR:   '🛒 Пазар',
}

const SHORT_MONTH = new Intl.DateTimeFormat('bg-BG', { month: 'short' })
const SHORT_WEEKDAY = new Intl.DateTimeFormat('bg-BG', { weekday: 'short' })

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

        {/* Банер за квиз — само в Помощ при избор */}
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
              + {кат.db === 'PAZAR' ? 'Нова обява' : кат.db === 'SRESHTI' ? 'Ново събитие' : 'Нова тема'}
            </Link>
          ) : (
            <Link href="/login" className="shrink-0 text-sm text-brand-600 font-medium hover:underline">
              Влез за да публикуваш
            </Link>
          )}
        </div>

        {/* Списък */}
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

  // ── Dashboard ─────────────────────────────────────────────────
  const now = new Date()

  const [recentThreads, upcomingEvents] = await Promise.all([
    prisma.thread.findMany({
      where:   { category: { in: ['IZBOR', 'PRAVILA', 'PAZAR'] } },
      orderBy: { updatedAt: 'desc' },
      take:    6,
      select: {
        id: true, slug: true, title: true, category: true,
        updatedAt: true,
        author: { select: { name: true, image: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.thread.findMany({
      where:   { category: 'SRESHTI', eventDate: { gte: now } },
      orderBy: { eventDate: 'asc' },
      take:    4,
      select: {
        id: true, slug: true, title: true,
        eventType: true, eventDate: true, eventCity: true,
      },
    }),
  ])

  return (
    <div className="container mx-auto px-4 pt-12 pb-20 max-w-4xl">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Общност
        </h1>
        <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
          Свържи се с любители на настолни игри, намери играчи, обсъждай правила и открий предстоящи събития.
        </p>
      </div>

      {/* ── 4 Карти ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
        {КАРТИ.map((к) => (
          <Link
            key={к.href}
            href={к.href}
            className={`group bg-gradient-to-br ${к.grad} border-2 ${к.border} rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 ${к.icon} rounded-xl text-2xl mb-4 shadow-sm`}>
              {к.emoji}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{к.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">{к.desc}</p>
            <div className={`flex items-center text-sm font-semibold ${к.link}`}>
              {к.linkText}
              <span className="ml-1.5 group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Долна секция: Разговори + Събития ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

        {/* Последни разговори (3/5) */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Последни разговори</h2>
            <Link href={tabHref('izbor')} className="text-sm text-brand-600 font-medium hover:underline">
              Всички →
            </Link>
          </div>

          {recentThreads.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Все още няма разговори.</p>
          ) : (
            <div className="space-y-2">
              {recentThreads.map((т) => {
                const slug = DB_КЪМ_SLUG[т.category] ?? 'izbor'
                return (
                  <Link
                    key={т.id}
                    href={`/obshtnost/${slug}/${т.slug}`}
                    className="group flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-brand-200 hover:shadow-sm transition-all"
                  >
                    {/* Аватар */}
                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-100">
                      {т.author.image ? (
                        <Image src={т.author.image} alt="" fill className="object-cover" sizes="32px" />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full text-xs font-bold text-gray-500">
                          {(т.author.name ?? '?')[0].toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Съдържание */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 truncate transition-colors">
                        {т.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded-md font-medium text-gray-500">
                          {КАТ_BADGE[т.category]}
                        </span>
                        <span>·</span>
                        <span>{т._count.replies} отг.</span>
                        <span>·</span>
                        <span>{относителноВреме(т.updatedAt)}</span>
                      </div>
                    </div>

                    <span className="text-gray-300 group-hover:text-brand-400 transition-colors shrink-0">→</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Предстоящи събития (2/5) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Предстоящи събития</h2>
            <Link href="/obshtnost/sreshti" className="text-sm text-brand-600 font-medium hover:underline">
              Календар →
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-6 text-center">
              <p className="text-sm text-gray-500 mb-3">Все още няма предстоящи събития.</p>
              <Link href="/obshtnost/sreshti?new=1" className="text-sm font-semibold text-orange-600 hover:underline">
                + Добави събитие
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((е) => {
                const start      = е.eventDate!
                const typeConfig = е.eventType ? (EVENT_TYPES[е.eventType as EventTypeName] ?? null) : null
                return (
                  <Link
                    key={е.id}
                    href={`/obshtnost/sreshti/${е.slug}`}
                    className="group flex gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-orange-200 hover:shadow-sm transition-all"
                  >
                    {/* Дата */}
                    <div className="shrink-0 w-11 bg-orange-50 rounded-lg py-1.5 text-center">
                      <div className="text-base font-bold text-orange-600 leading-tight">
                        {start.getDate()}
                      </div>
                      <div className="text-xs text-gray-500 leading-tight">
                        {SHORT_MONTH.format(start)}
                      </div>
                      <div className="text-xs text-gray-400 leading-tight">
                        {SHORT_WEEKDAY.format(start)}
                      </div>
                    </div>

                    {/* Съдържание */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 truncate transition-colors">
                        {е.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {typeConfig && (
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${typeConfig.color}`}>
                            {typeConfig.icon} {typeConfig.label}
                          </span>
                        )}
                        {е.eventCity && (
                          <span className="text-xs text-gray-400">📍 {е.eventCity}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}

              <Link
                href="/obshtnost/sreshti?new=1"
                className="block text-center text-sm font-medium text-orange-600 hover:underline py-2"
              >
                + Добави събитие
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
