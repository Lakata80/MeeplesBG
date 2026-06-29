import { notFound }              from 'next/navigation'
import Image                      from 'next/image'
import Link                       from 'next/link'
import type { Metadata }          from 'next'
import { getWeeklyGameBySlug, getAllWeeklyGameSlugs } from '@/lib/sanity/queries'
import { urlFor }                 from '@/lib/sanity/image'
import { prisma }                 from '@/lib/prisma'

export const revalidate = 3600

// ── Статично генериране ───────────────────────────────────

export async function generateStaticParams() {
  try {
    const slugове = await getAllWeeklyGameSlugs()
    return slugове.map((slug) => ({ slug }))
  } catch {
    return []
  }
}

// ── SEO метаданни ─────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const игра     = await getWeeklyGameBySlug(slug)
  if (!игра) return { title: 'Игра на седмицата | MeeplesBG' }

  const ogImage = игра.bannerImage
    ? urlFor(игра.bannerImage).width(1200).height(630).url()
    : undefined

  return {
    title:       `${игра.gameName} — Игра на седмицата | MeeplesBG`,
    description: игра.teaserBg ?? `${игра.gameName} е избрана за Игра на седмицата в MeeplesBG.`,
    openGraph: {
      title:       `${игра.gameName} — Игра на седмицата`,
      description: игра.teaserBg,
      type:        'article',
      images:      ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

// ── Страница ──────────────────────────────────────────────

export default async function ИгратаНаСедмицатаСтраница(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const игра     = await getWeeklyGameBySlug(slug)
  if (!игра) notFound()

  // Взимаме данни за играта от нашата БД (по gameSlug)
  const dbИгра = await prisma.game.findUnique({
    where:  { slug: игра.gameSlug },
    select: {
      slug:         true,
      titleBg:      true,
      titleEn:      true,
      yearPublished: true,
      minPlayers:   true,
      maxPlayers:   true,
      minPlaytime:  true,
      maxPlaytime:  true,
      weight:       true,
      bggRating:    true,
      categories:   true,
      mechanics:    true,
      imageUrl:     true,
    },
  }).catch(() => null)

  const bannerUrl = игра.bannerImage
    ? urlFor(игра.bannerImage).width(1600).height(900).fit('crop').url()
    : dbИгра?.imageUrl ?? null

  // Schema.org разметка
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'Article',
    headline:   `${игра.gameName} — Игра на седмицата`,
    description: игра.teaserBg,
    image:       bannerUrl ?? undefined,
    publisher: {
      '@type': 'Organization',
      name:    'MeeplesBG',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        {/* ── Hero banner ──────────────────────────────── */}
        <div className="relative w-full aspect-[16/7] min-h-[320px] bg-brand-800 overflow-hidden">
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt={игра.gameName}
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

          {/* Hero текст */}
          <div className="absolute inset-0 flex items-end pb-10 md:items-center">
            <div className="container mx-auto px-6 max-w-4xl">
              {/* Бадж */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-gold-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                  🏆 Игра на седмицата
                </span>
                {игра.weekLabel && (
                  <span className="text-white/60 text-xs">{игра.weekLabel}</span>
                )}
              </div>

              {/* Заглавие */}
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-3 drop-shadow-lg">
                {игра.gameName}
              </h1>

              {/* Редакционен headline */}
              {игра.headlineBg && (
                <p className="text-lg md:text-xl text-white/90 font-medium mb-6 max-w-xl drop-shadow">
                  {игра.headlineBg}
                </p>
              )}

              {/* CTA бутон */}
              {dbИгра && (
                <Link
                  href={`/igri/${dbИгра.slug}`}
                  className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg"
                >
                  Виж играта в MeeplesBG →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Съдържание ───────────────────────────────── */}
        <div className="container mx-auto px-4 py-10 max-w-4xl">

          {/* Хлебни трохи */}
          <nav aria-label="Хлебни трохи" className="text-sm text-gray-400 mb-8 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-brand-600 transition-colors">Начало</Link>
            <span>›</span>
            <Link href="/igri/populiarni" className="hover:text-brand-600 transition-colors">Популярни игри</Link>
            <span>›</span>
            <span className="text-gray-700">{игра.gameName}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

            {/* ── Основен текст ── */}
            <div className="md:col-span-2">
              <div className="inline-flex items-center gap-1.5 bg-gold-500/10 text-gold-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                🏆 Игра на седмицата{игра.weekLabel ? ` · ${игра.weekLabel}` : ''}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">{игра.gameName}</h2>

              {игра.teaserBg && (
                <p className="text-gray-600 leading-relaxed text-lg mb-8">{игра.teaserBg}</p>
              )}

              {dbИгра && (
                <Link
                  href={`/igri/${dbИгра.slug}`}
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Разгледай {игра.gameName} →
                </Link>
              )}
            </div>

            {/* ── Мета карта ── */}
            {dbИгра && (
              <aside className="bg-gray-50 rounded-2xl p-6 border border-gray-100 self-start">
                <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">
                  За играта
                </h3>
                <dl className="space-y-3">
                  {dbИгра.yearPublished && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Година</dt>
                      <dd className="font-medium text-gray-900">{dbИгра.yearPublished}</dd>
                    </div>
                  )}
                  {(dbИгра.minPlayers || dbИгра.maxPlayers) && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Играчи</dt>
                      <dd className="font-medium text-gray-900">
                        {dbИгра.minPlayers === dbИгра.maxPlayers
                          ? dbИгра.minPlayers
                          : `${dbИгра.minPlayers ?? '?'}–${dbИгра.maxPlayers ?? '?'}`}
                      </dd>
                    </div>
                  )}
                  {(dbИгра.minPlaytime || dbИгра.maxPlaytime) && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Времетраене</dt>
                      <dd className="font-medium text-gray-900">
                        {dbИгра.minPlaytime === dbИгра.maxPlaytime
                          ? `${dbИгра.minPlaytime} мин`
                          : `${dbИгра.minPlaytime ?? '?'}–${dbИгра.maxPlaytime ?? '?'} мин`}
                      </dd>
                    </div>
                  )}
                  {dbИгра.weight && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">Сложност</dt>
                      <dd className="font-medium text-gray-900">{dbИгра.weight.toFixed(1)} / 5</dd>
                    </div>
                  )}
                  {dbИгра.bggRating && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-gray-500">BGG рейтинг</dt>
                      <dd className="font-medium text-gray-900">⭐ {dbИгра.bggRating.toFixed(1)}</dd>
                    </div>
                  )}
                </dl>

                {dbИгра.categories.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Категории</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dbИгра.categories.slice(0, 4).map((cat) => (
                        <span key={cat} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={`/igri/${dbИгра.slug}`}
                  className="mt-5 flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Виж пълната страница →
                </Link>
              </aside>
            )}
          </div>

          {/* ── Навигация обратно ─────────────────────── */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
            <Link
              href="/igri/populiarni"
              className="text-sm text-brand-600 hover:text-brand-700 transition-colors"
            >
              ← Обратно към Популярни игри
            </Link>
            <Link
              href="/igri/igra-na-sedmicata"
              className="text-sm text-gray-500 hover:text-brand-600 transition-colors"
            >
              🏆 Виж всички минали избори →
            </Link>
          </div>
        </div>
      </article>
    </>
  )
}
