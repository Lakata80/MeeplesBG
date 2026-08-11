import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { BlogCategory } from '@prisma/client'

const КАТЕГОРИЯ_ЕТИКЕТ: Record<BlogCategory, string> = {
  NEWS:   'Новини',
  REVIEW: 'Ревю',
  BLOG:   'Блог',
  GUIDE:  'Наръчник',
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('bg-BG', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })
}

export default async function NewsSection() {
  const публикации = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      publishedAt: { lte: new Date() },
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: {
      slug:        true,
      titleBg:     true,
      excerpt:     true,
      imageUrl:    true,
      publishedAt: true,
      category:    true,
    },
  })

  if (публикации.length === 0) return null

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🌍 Светът на настолните игри</h2>
          <Link href="/novini" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
            Виж всички →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {публикации.map((п) => (
            <Link
              key={п.slug}
              href={`/новини/${п.slug}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-brand-200 transition-all duration-200"
            >
              {/* Снимка */}
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                {п.imageUrl ? (
                  <Image
                    src={п.imageUrl}
                    alt={п.titleBg}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-200">
                    📰
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="bg-brand-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {КАТЕГОРИЯ_ЕТИКЕТ[п.category]}
                  </span>
                </div>
              </div>

              {/* Съдържание */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-brand-600 transition-colors mb-2">
                  {п.titleBg}
                </h3>

                {п.excerpt && (
                  <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-3">
                    {п.excerpt}
                  </p>
                )}

                {п.publishedAt && (
                  <time
                    dateTime={п.publishedAt.toISOString()}
                    className="text-xs text-gray-400"
                  >
                    {formatDate(п.publishedAt)}
                  </time>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
