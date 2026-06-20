import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { КАТЕГОРИИ_КЛАСАЦИИ, getRanking, getCategory, type КласациоИгра } from '@/lib/rankings'

export const dynamic = 'force-dynamic'

// ── SEO метаданни ────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ kategoria: string }> },
): Promise<Metadata> {
  const { kategoria } = await params
  const кат = getCategory(kategoria)
  if (!кат) return { title: 'Топ класация | MeeplesBG' }

  const година = new Date().getFullYear()
  return {
    title:       `${кат.пълноЗаглавие} ${година} | MeeplesBG`,
    description: кат.описание,
    openGraph: {
      title:       `${кат.пълноЗаглавие} ${година} | MeeplesBG`,
      description: кат.описание,
    },
  }
}

// ── Помощни функции ──────────────────────────────────────────

function formatPlayers(min: number | null, max: number | null): string {
  if (!min && !max) return '—'
  if (min === max || !max) return `${min}`
  return `${min}–${max}`
}

function formatWeight(w: number | null): string {
  if (!w) return '—'
  return w.toFixed(1)
}

function ПозицияЯчейка({ позиция }: { позиция: number }) {
  if (позиция === 1) return <span className="text-2xl" aria-label="1-во място">🥇</span>
  if (позиция === 2) return <span className="text-2xl" aria-label="2-ро място">🥈</span>
  if (позиция === 3) return <span className="text-2xl" aria-label="3-то място">🥉</span>
  return (
    <span className="text-sm font-semibold text-gray-400 tabular-nums">
      #{позиция}
    </span>
  )
}

function ОценкаЗнак({ стойност }: { стойност: number | null }) {
  if (!стойност) return <span className="text-gray-400 text-sm">—</span>
  const цвят =
    стойност >= 8 ? 'bg-green-100 text-green-700' :
    стойност >= 7 ? 'bg-blue-100 text-blue-700' :
    стойност >= 6 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-sm font-bold tabular-nums ${цвят}`}>
      {стойност.toFixed(1)}
    </span>
  )
}

function СложностЛента({ стойност }: { стойност: number | null }) {
  if (!стойност) return <span className="text-gray-400 text-sm">—</span>
  const процент = Math.round((стойност / 5) * 100)
  const цвят =
    стойност <= 2   ? 'bg-green-400' :
    стойност <= 3.5 ? 'bg-yellow-400' :
                      'bg-red-400'
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${цвят}`} style={{ width: `${процент}%` }} />
      </div>
      <span className="text-xs text-gray-500 tabular-nums">{formatWeight(стойност)}</span>
    </div>
  )
}

function редЦвят(позиция: number): string {
  if (позиция === 1) return 'bg-yellow-50/60'
  if (позиция === 2) return 'bg-gray-50/60'
  if (позиция === 3) return 'bg-orange-50/40'
  return 'bg-white'
}

// ── Ред от таблицата ─────────────────────────────────────────

function КласациоРед({
  игра,
  позиция,
}: {
  игра:     КласациоИгра
  позиция: number
}) {
  const заглавие = игра.titleBg || игра.titleEn || 'Непозната игра'
  const снимка   = игра.thumbnailUrl ?? игра.imageUrl

  return (
    <tr className={`${редЦвят(позиция)} border-b border-gray-100 hover:bg-blue-50/30 transition-colors`}>

      {/* Позиция */}
      <td className="px-3 py-3 text-center w-12">
        <ПозицияЯчейка позиция={позиция} />
      </td>

      {/* Снимка + заглавие */}
      <td className="px-3 py-3">
        <Link href={`/igri/${игра.slug}`} className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {снимка ? (
              <Image
                src={снимка}
                alt={заглавие}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-200"
                sizes="40px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-200 text-lg">🎲</div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
              {заглавие}
            </p>
            {игра.titleEn && игра.titleBg && (
              <p className="text-xs text-gray-400 leading-tight mt-0.5">{игра.titleEn}</p>
            )}
            {/* Тип бадж — видим на мобилни */}
            {игра.types[0] && (
              <span className="md:hidden inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                {игра.types[0]}
              </span>
            )}
          </div>
        </Link>
      </td>

      {/* Година */}
      <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-500 text-center tabular-nums">
        {игра.yearPublished ?? '—'}
      </td>

      {/* Играчи */}
      <td className="hidden md:table-cell px-3 py-3 text-sm text-gray-600 text-center tabular-nums">
        {formatPlayers(игра.minPlayers, игра.maxPlayers)}
      </td>

      {/* Оценка */}
      <td className="px-3 py-3 text-center">
        <ОценкаЗнак стойност={игра.bggRating} />
      </td>

      {/* Сложност */}
      <td className="hidden md:table-cell px-3 py-3">
        <СложностЛента стойност={игра.weight} />
      </td>
    </tr>
  )
}

// ── Скелет при зареждане ─────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100">
          <div className="w-10 h-4 bg-gray-200 rounded mx-3" />
          <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-48" />
            <div className="h-2.5 bg-gray-100 rounded w-32" />
          </div>
          <div className="w-12 h-6 bg-gray-200 rounded-lg mx-3" />
        </div>
      ))}
    </div>
  )
}

// ── Главна страница ──────────────────────────────────────────

export default async function КатегорияСтраница(
  { params }: { params: Promise<{ kategoria: string }> },
) {
  const { kategoria } = await params

  const кат   = getCategory(kategoria)
  if (!кат) notFound()

  const игри  = (await getRanking(kategoria)) ?? []
  const година = new Date().getFullYear()
  const сайт  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://meeplesbg.com'

  const itemListSchema = {
    '@context':     'https://schema.org',
    '@type':        'ItemList',
    name:            `${кат.пълноЗаглавие} ${година}`,
    description:     кат.описание,
    numberOfItems:   игри.length,
    itemListElement: игри.slice(0, 10).map((игра, i) => ({
      '@type':    'ListItem',
      position:    i + 1,
      item: {
        '@type': 'BoardGame',
        name:     игра.titleBg || игра.titleEn || '',
        url:      `${сайт}/igri/${игра.slug}`,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <div className="container mx-auto px-4 py-8">

      {/* Хлебни трохи */}
      <nav aria-label="Хлебни трохи" className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-blue-600 transition-colors">Начало</Link>
        <span>›</span>
        <Link href="/top" className="hover:text-blue-600 transition-colors">Топ класации</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">{кат.заглавие}</span>
      </nav>

      {/* Заглавие */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl" aria-hidden>{кат.икона}</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {кат.пълноЗаглавие} {година}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{кат.описание}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-6">
        Актуализирано: {new Date().toLocaleDateString('bg-BG', { year: 'numeric', month: 'long', day: 'numeric' })}
        {' · '}Данни от BoardGameGeek
      </p>

      {/* Таблица */}
      {игри.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <div className="text-5xl mb-4">🎲</div>
          <p className="text-lg font-medium text-gray-600 mb-2">Няма игри в тази класация</p>
          <p className="text-sm">Базата данни все още не съдържа игри за тази категория.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center w-12">
                  #
                </th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Игра
                </th>
                <th className="hidden md:table-cell px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
                  Год.
                </th>
                <th className="hidden md:table-cell px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
                  Играчи
                </th>
                <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
                  Оценка
                </th>
                <th className="hidden md:table-cell px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Сложност
                </th>
              </tr>
            </thead>
            <tbody>
              {игри.map((игра, i) => (
                <КласациоРед key={игра.id} игра={игра} позиция={i + 1} />
              ))}
            </tbody>
          </table>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-right">
            {игри.length} игри · Сортирани по BGG оценка
          </div>
        </div>
      )}

      {/* Линкове към другите класации */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Виж също:</h2>
        <div className="flex flex-wrap gap-2">
          {КАТЕГОРИИ_КЛАСАЦИИ.filter((к) => к.slug !== kategoria).map((к) => (
            <Link
              key={к.slug}
              href={`/top/${к.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 text-sm rounded-full transition-colors"
            >
              <span aria-hidden>{к.икона}</span>
              {к.заглавие}
            </Link>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}
