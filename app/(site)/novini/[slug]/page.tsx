import { Suspense }          from 'react'
import { notFound }          from 'next/navigation'
import Image                 from 'next/image'
import Link                  from 'next/link'
import type { Metadata }     from 'next'
import {
  getPostBySlug,
  getRelatedPosts,
  getAllPostSlugs,
  type КатегорияСтатия,
}                            from '@/lib/sanity/queries'
import { urlFor }            from '@/lib/sanity/image'
import PortableTextRenderer  from '@/components/blog/PortableTextRenderer'
import ShareButtons          from '@/components/blog/ShareButtons'
import BlogCommentsSection   from '@/components/blog/BlogCommentsSection'
import PostCard              from '@/components/blog/PostCard'

export const revalidate = 3600

// ── Статично генериране ───────────────────────────────────────

export async function generateStaticParams() {
  try {
    const slugove = await getAllPostSlugs()
    return slugove.map((slug) => ({ slug }))
  } catch {
    return []
  }
}

// ── Константи ─────────────────────────────────────────────────

const КАТЕГОРИЯ_НАДПИС: Record<КатегорияСтатия, string> = {
  NEWS:   'Новини',
  REVIEW: 'Ревю',
  BLOG:   'Блог',
  GUIDE:  'Наръчник',
}

const КАТЕГОРИЯ_ЦВЯТ: Record<КатегорияСтатия, string> = {
  NEWS:   'bg-blue-100 text-blue-700',
  REVIEW: 'bg-purple-100 text-purple-700',
  BLOG:   'bg-gray-100 text-gray-700',
  GUIDE:  'bg-green-100 text-green-700',
}

const ФОРМАТ_ДАТА = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'long' })

function форматДата(iso: string): string {
  return ФОРМАТ_ДАТА.format(new Date(iso))
}

// ── SEO метаданни ─────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const статия   = await getPostBySlug(slug)
  if (!статия) return { title: 'Статия не е намерена | MeeplesBG' }

  const ogImage = статия.mainImage
    ? urlFor(статия.mainImage).width(1200).height(630).url()
    : undefined

  return {
    title:       `${статия.title} | MeeplesBG`,
    description: статия.excerpt ?? `Прочетете „${статия.title}" в MeeplesBG.`,
    openGraph: {
      title:       статия.title,
      description: статия.excerpt,
      type:        'article',
      publishedTime: статия.publishedAt,
      authors:     статия.author ? [статия.author.name] : undefined,
      images:      ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

// ── Свързани статии ───────────────────────────────────────────

async function СвързаниСтатии({
  category,
  excludeId,
}: {
  category:  КатегорияСтатия
  excludeId: string
}) {
  const свързани = await getRelatedPosts(category, excludeId, 3)
  if (свързани.length === 0) return null

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Свързани статии
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {свързани.map((с) => (
          <PostCard key={с._id} статия={с} />
        ))}
      </div>
    </section>
  )
}

// ── Главна страница ───────────────────────────────────────────

export default async function СтатияСтраница(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const статия   = await getPostBySlug(slug)
  if (!статия) notFound()

  const heroImage = статия.mainImage
    ? urlFor(статия.mainImage).width(1600).height(800).url()
    : null

  const авторImage = статия.author?.image
    ? urlFor(статия.author.image).width(80).height(80).url()
    : null

  // Schema.org Article разметка
  const jsonLd = {
    '@context':       'https://schema.org',
    '@type':          'Article',
    headline:         статия.title,
    description:      статия.excerpt,
    datePublished:    статия.publishedAt,
    author:           статия.author
      ? { '@type': 'Person', name: статия.author.name }
      : undefined,
    image:            heroImage ?? undefined,
    publisher: {
      '@type': 'Organization',
      name:    'MeeplesBG',
      logo:    { '@type': 'ImageObject', url: 'https://meeplesbg.com/logo.png' },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        {/* Hero снимка */}
        {heroImage && (
          <div className="relative w-full aspect-[16/7] bg-gray-200 overflow-hidden">
            <Image
              src={heroImage}
              alt={статия.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 py-10 max-w-3xl">

          {/* Хлебни трохи */}
          <nav aria-label="Хлебни трохи" className="text-sm text-gray-400 mb-6 flex items-center gap-1.5">
            <Link href="/" className="hover:text-blue-600 transition-colors">Начало</Link>
            <span>›</span>
            <Link href="/novini" className="hover:text-blue-600 transition-colors">Новини</Link>
            <span>›</span>
            <span className="text-gray-700 truncate max-w-[200px]">{статия.title}</span>
          </nav>

          {/* Категория бадж */}
          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4 ${КАТЕГОРИЯ_ЦВЯТ[статия.category]}`}>
            {КАТЕГОРИЯ_НАДПИС[статия.category]}
          </span>

          {/* Заглавие */}
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">
            {статия.title}
          </h1>

          {/* Автор и дата */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
            {авторImage && (
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                <Image
                  src={авторImage}
                  alt={статия.author?.name ?? ''}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            )}
            <div>
              {статия.author?.name && (
                <p className="text-sm font-semibold text-gray-900">{статия.author.name}</p>
              )}
              <p className="text-xs text-gray-500">{форматДата(статия.publishedAt)}</p>
            </div>
          </div>

          {/* Извадка */}
          {статия.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed mb-8 font-medium">
              {статия.excerpt}
            </p>
          )}

          {/* Съдържание (Portable Text) */}
          {статия.body && статия.body.length > 0 && (
            <div className="mb-8">
              <PortableTextRenderer body={статия.body} />
            </div>
          )}

          {/* Бутони за споделяне */}
          <div className="flex items-center gap-4 py-6 border-t border-gray-200">
            <ShareButtons title={статия.title} />
          </div>

          {/* Биография на автора */}
          {статия.author?.bio && (
            <div className="bg-gray-50 rounded-2xl p-6 flex gap-4 my-8">
              {авторImage && (
                <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={авторImage}
                    alt={статия.author.name ?? ''}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 mb-1">{статия.author.name}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{статия.author.bio}</p>
              </div>
            </div>
          )}

          {/* Свързани статии */}
          <Suspense fallback={null}>
            <СвързаниСтатии category={статия.category} excludeId={статия._id} />
          </Suspense>

          {/* Коментари */}
          <Suspense fallback={<div className="mt-12 h-40 animate-pulse bg-gray-100 rounded-2xl" />}>
            <BlogCommentsSection postSlug={slug} />
          </Suspense>

        </div>
      </article>
    </>
  )
}
