import { Suspense }      from 'react'
import { notFound }      from 'next/navigation'
import Link              from 'next/link'
import type { Metadata } from 'next'
import { auth }          from '@/auth'
import { prisma }        from '@/lib/prisma'
import { getКатегория, type ThreadCategorySlug } from '@/lib/obshtnost'
import ThreadCard, { type ThreadCardData } from '@/components/obshtnost/ThreadCard'
import NewThreadFormWrapper from './NewThreadFormWrapper'
import Pagination        from '@/components/ui/Pagination'

export const dynamic = 'force-dynamic'

type Params = Promise<{ category: string }>
type SearchParams = Promise<Record<string, string | undefined>>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params
  const кат = getКатегория(category)
  if (!кат) return {}
  return {
    title:       `${кат.label} | Общност | MeeplesBG`,
    description: кат.desc,
  }
}

const НА_СТРАНИЦА = 20

export default async function КатегорияСтраница({
  params,
  searchParams,
}: {
  params:       Params
  searchParams: SearchParams
}) {
  const { category } = await params
  const sp           = await searchParams
  const кат          = getКатегория(category)
  if (!кат) notFound()

  const страница = Math.max(1, parseInt(sp.stranica ?? '1') || 1)
  const offset   = (страница - 1) * НА_СТРАНИЦА
  const showNew  = sp.new === '1'
  const deleted  = sp.deleted === '1'

  const session = await auth()

  const [теми, общо] = await Promise.all([
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
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Съобщение след изтриване */}
      {deleted && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl">
          Темата беше изтрита успешно.
        </div>
      )}

      {/* Хлебни трохи */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/obshtnost" className="hover:text-brand-600">Общност</Link>
        <span>›</span>
        <span className="text-gray-700">{кат.icon} {кат.label}</span>
      </nav>

      {/* Заглавие */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{кат.icon} {кат.label}</h1>
          <p className="text-sm text-gray-500 mt-1">{кат.desc}</p>
        </div>
        {session && !showNew && (
          <Link
            href={`/obshtnost/${category}?new=1`}
            className="shrink-0 px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            + Нова тема
          </Link>
        )}
        {!session && (
          <Link
            href="/login"
            className="shrink-0 text-sm text-brand-600 font-medium hover:underline"
          >
            Влез за да публикуваш
          </Link>
        )}
      </div>

      {/* Форма за нова тема */}
      {session && showNew && (
        <div className="mb-8">
          <Suspense fallback={null}>
            <NewThreadFormWrapper categorySlug={category as ThreadCategorySlug} />
          </Suspense>
        </div>
      )}

      {/* Списък с теми */}
      {теми.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <div className="text-4xl mb-3">{кат.icon}</div>
          <p className="text-gray-600 font-medium mb-1">Все още няма теми</p>
          <p className="text-sm">Бъди първи — публикувай нова тема!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {теми.map((т) => (
            <ThreadCard
              key={т.id}
              thread={т as ThreadCardData}
              categorySlug={category as ThreadCategorySlug}
            />
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
