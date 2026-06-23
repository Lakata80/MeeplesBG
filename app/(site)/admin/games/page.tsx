import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Игри — Администрация' }

const НА_СТРАНИЦА = 50

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'ADMIN') redirect('/')

  const { q = '', page = '1' } = await searchParams
  const страница = Math.max(1, parseInt(page, 10) || 1)
  const пропуснати = (страница - 1) * НА_СТРАНИЦА

  const where = q.trim()
    ? {
        OR: [
          { titleBg: { contains: q, mode: 'insensitive' as const } },
          { titleEn: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [игри, общо] = await Promise.all([
    prisma.game.findMany({
      where,
      select: {
        id: true, slug: true, titleBg: true, titleEn: true,
        bggId: true, yearPublished: true, types: true,
        descriptionBg: true, isActive: true,
        _count: { select: { pendingImages: true } },
      },
      orderBy: { titleBg: 'asc' },
      skip:  пропуснати,
      take:  НА_СТРАНИЦА,
    }),
    prisma.game.count({ where }),
  ])

  const общоСтраници = Math.ceil(общо / НА_СТРАНИЦА)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('page', String(p))
    return `/admin/games?${params}`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-brand-600 text-sm">← Администрация</Link>
        <h1 className="text-2xl font-bold text-brand-800">
          Игри
          <span className="ml-2 text-base font-normal text-gray-400">({общо})</span>
        </h1>
      </div>

      {/* Търсене */}
      <form method="GET" className="mb-6">
        <div className="flex gap-2 max-w-md">
          <input
            name="q"
            defaultValue={q}
            placeholder="Търси по заглавие…"
            className="flex-1 border border-[var(--border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
          >
            Търси
          </button>
          {q && (
            <Link
              href="/admin/games"
              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition-colors"
            >
              ✕
            </Link>
          )}
        </div>
      </form>

      {/* Таблица */}
      <div className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-[var(--border)]">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Заглавие</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">BGG ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Год.</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Видове</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Опис.</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Акт.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {игри.map((г) => (
              <tr key={г.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/igri/${г.slug}`}
                    target="_blank"
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {г.titleBg}
                  </Link>
                  {г.titleEn && (
                    <span className="block text-xs text-gray-400 truncate max-w-[200px]">{г.titleEn}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                  {г.bggId ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                  {г.yearPublished ?? '—'}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {г.types.map((т) => (
                      <span key={т} className="text-xs bg-brand-50 text-brand-700 rounded-full px-2 py-0.5">
                        {т}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {г.descriptionBg ? (
                    <span className="text-green-500 font-bold">✓</span>
                  ) : (
                    <span className="text-gray-200">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {г.isActive ? (
                    <span className="text-green-500 font-bold">✓</span>
                  ) : (
                    <span className="text-red-400">✕</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {игри.length === 0 && (
          <p className="text-center text-gray-400 py-12">Няма намерени игри.</p>
        )}
      </div>

      {/* Пагинация */}
      {общоСтраници > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Страница {страница} от {общоСтраници}</span>
          <div className="flex gap-2">
            {страница > 1 && (
              <Link href={pageUrl(страница - 1)}
                className="px-3 py-1.5 bg-white border border-[var(--border)] rounded-lg hover:bg-gray-50">
                ← Предишна
              </Link>
            )}
            {страница < общоСтраници && (
              <Link href={pageUrl(страница + 1)}
                className="px-3 py-1.5 bg-white border border-[var(--border)] rounded-lg hover:bg-gray-50">
                Следваща →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
