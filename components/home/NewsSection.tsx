import Image from 'next/image'
import Link from 'next/link'
import { getAllPosts } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import type { СтатияКарта, КатегорияСтатия } from '@/lib/sanity/queries'

const КАТЕГОРИЯ_ЕТИКЕТ: Record<КатегорияСтатия, string> = {
  NEWS:   'Новини',
  REVIEW: 'Ревю',
  BLOG:   'Блог',
  GUIDE:  'Наръчник',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('bg-BG', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })
}

function КатегорияБадж({ category }: { category: КатегорияСтатия }) {
  return (
    <span className="bg-brand-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
      {КАТЕГОРИЯ_ЕТИКЕТ[category]}
    </span>
  )
}

function ФийчърдКарта({ п }: { п: СтатияКарта }) {
  const imgUrl = п.mainImage
    ? urlFor(п.mainImage).width(800).height(450).url()
    : null

  return (
    <Link
      href={`/novini/${п.slug.current}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-brand-200 transition-all duration-200 flex flex-col"
    >
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={п.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, 66vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl text-gray-200">
            📰
          </div>
        )}
        <div className="absolute top-3 left-3">
          <КатегорияБадж category={п.category} />
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-3 group-hover:text-brand-600 transition-colors mb-2">
          {п.title}
        </h3>
        {п.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-3 flex-1">
            {п.excerpt}
          </p>
        )}
        {п.publishedAt && (
          <time dateTime={п.publishedAt} className="text-xs text-gray-400 mt-auto">
            {formatDate(п.publishedAt)}
          </time>
        )}
      </div>
    </Link>
  )
}

function МалкаКарта({ п }: { п: СтатияКарта }) {
  const imgUrl = п.mainImage
    ? urlFor(п.mainImage).width(400).height(225).url()
    : null

  return (
    <Link
      href={`/novini/${п.slug.current}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-brand-200 transition-all duration-200 flex gap-3 p-3"
    >
      {imgUrl && (
        <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={imgUrl}
            alt={п.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="96px"
          />
        </div>
      )}
      <div className="flex flex-col justify-between min-w-0">
        <div>
          <КатегорияБадж category={п.category} />
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors mt-1.5">
            {п.title}
          </h3>
        </div>
        {п.publishedAt && (
          <time dateTime={п.publishedAt} className="text-xs text-gray-400 mt-1">
            {formatDate(п.publishedAt)}
          </time>
        )}
      </div>
    </Link>
  )
}

export default async function NewsSection() {
  let posts: СтатияКарта[] = []
  try {
    const result = await getAllPosts(3)
    posts = result.posts
  } catch {
    return null
  }

  if (posts.length === 0) return null

  const [featured, ...rest] = posts

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🌍 Светът на настолните игри</h2>
          <Link href="/novini" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
            Всички статии →
          </Link>
        </div>

        {/* Десктоп: featured (2/3) + малки (1/3) — Мобилен: вертикален стек */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Featured */}
          <div className="lg:col-span-2">
            <ФийчърдКарта п={featured} />
          </div>

          {/* Малки статии */}
          {rest.length > 0 && (
            <div className="flex flex-col gap-4">
              {rest.map((п) => (
                <МалкаКарта key={п._id} п={п} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
