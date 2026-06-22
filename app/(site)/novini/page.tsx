import Link                from 'next/link'
import type { Metadata }   from 'next'
import { getAllPosts, getPostsByCategory, type КатегорияСтатия } from '@/lib/sanity/queries'
import PostCard            from '@/components/blog/PostCard'
import NewsletterForm      from '@/components/newsletter/NewsletterForm'

export const revalidate = 3600

// ── Типове ───────────────────────────────────────────────────

type SearchParamsType = Promise<Record<string, string | string[] | undefined>>

// ── Константи ────────────────────────────────────────────────

const БРОЙ_НА_СТРАНИЦА = 10

const ТАБОВЕ: { надпис: string; стойност: string | null; kat: string }[] = [
  { надпис: 'Всички',       стойност: null,     kat: '' },
  { надпис: 'Новини',       стойност: 'NEWS',   kat: 'novini' },
  { надпис: 'Ревюта',       стойност: 'REVIEW', kat: 'revyu' },
  { надпис: 'Блог',         стойност: 'BLOG',   kat: 'blog' },
  { надпис: 'Ръководства',  стойност: 'GUIDE',  kat: 'narachnik' },
]

const KAT_КЪМ_САНИТИ: Record<string, КатегорияСтатия> = {
  novini:    'NEWS',
  revyu:     'REVIEW',
  blog:      'BLOG',
  narachnik: 'GUIDE',
}

// ── SEO ──────────────────────────────────────────────────────

export async function generateMetadata({ searchParams }: { searchParams: SearchParamsType }): Promise<Metadata> {
  const парам = await searchParams
  const kat   = typeof парам.kat === 'string' ? парам.kat : ''
  const таб   = ТАБОВЕ.find((т) => т.kat === kat)

  return таб?.стойност
    ? {
        title:       `${таб.надпис} | MeeplesBG`,
        description: `Разгледай всички статии в категория ${таб.надпис} на MeeplesBG.`,
      }
    : {
        title:       'Новини и Статии | MeeplesBG',
        description: 'Последни новини, ревюта и статии за настолни игри от MeeplesBG.',
      }
}

// ── Помощна функция за страница ──────────────────────────────

function getInt(val: string | string[] | undefined, дефолт = 1): number {
  const s = Array.isArray(val) ? val[0] : val
  const n = parseInt(s ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : дефолт
}

// ── Главна страница ───────────────────────────────────────────

export default async function НовиниСтраница({ searchParams }: { searchParams: SearchParamsType }) {
  const парам   = await searchParams
  const kat     = typeof парам.kat === 'string' ? парам.kat : ''
  const страница = getInt(парам.stranica)
  const offset  = (страница - 1) * БРОЙ_НА_СТРАНИЦА

  const санитиКат = KAT_КЪМ_САНИТИ[kat]

  const { posts, total } = санитиКат
    ? await getPostsByCategory(санитиКат, БРОЙ_НА_СТРАНИЦА, offset)
    : await getAllPosts(БРОЙ_НА_СТРАНИЦА, offset)

  const общоСтраници = Math.max(1, Math.ceil(total / БРОЙ_НА_СТРАНИЦА))

  function tabHref(kat: string, str = 1): string {
    const params = new URLSearchParams()
    if (kat)  params.set('kat',     kat)
    if (str > 1) params.set('stranica', String(str))
    const q = params.toString()
    return q ? `/novini?${q}` : '/novini'
  }

  return (
    <div className="container mx-auto px-4 py-10">

      {/* Заглавие */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📰 Новини и Статии</h1>
        <p className="text-gray-500 text-sm">
          Последни ревюта, новини и наръчници за настолни игри.
        </p>
      </div>

      {/* Табове за категории */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
        {ТАБОВЕ.map((т) => {
          const активен = т.kat === kat
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

      {/* Основна решетка: статии + sidebar */}
      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-10">

        {/* Мрежа от статии */}
        <div>
          {posts.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg font-medium text-gray-600 mb-2">Няма статии в тази категория</p>
              <p className="text-sm">Проверете по-късно или разгледайте другите категории.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {posts.map((статия) => (
                  <PostCard key={статия._id} статия={статия} />
                ))}
              </div>

              {/* Пагинация */}
              {общоСтраници > 1 && (
                <nav aria-label="Странициране" className="flex items-center justify-center gap-2 mt-10">
                  {страница > 1 && (
                    <Link
                      href={tabHref(kat, страница - 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                      aria-label="Предишна страница"
                    >
                      ←
                    </Link>
                  )}

                  {Array.from({ length: общоСтраници }, (_, i) => i + 1)
                    .filter((n) => Math.abs(n - страница) <= 2 || n === 1 || n === общоСтраници)
                    .map((n, idx, arr) => {
                      const prev = arr[idx - 1]
                      return (
                        <span key={n} className="flex items-center gap-2">
                          {prev && n - prev > 1 && (
                            <span className="text-gray-400 text-sm">…</span>
                          )}
                          <Link
                            href={tabHref(kat, n)}
                            aria-current={n === страница ? 'page' : undefined}
                            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                              n === страница
                                ? 'bg-brand-600 text-white'
                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {n}
                          </Link>
                        </span>
                      )
                    })}

                  {страница < общоСтраници && (
                    <Link
                      href={tabHref(kat, страница + 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                      aria-label="Следваща страница"
                    >
                      →
                    </Link>
                  )}
                </nav>
              )}

              <p className="text-center text-xs text-gray-400 mt-4">
                Страница {страница} от {общоСтраници} · {total} статии общо
              </p>
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="mt-10 lg:mt-0 space-y-6">
          {/* Бюлетин */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">📬 Бюлетин</h2>
            <p className="text-sm text-gray-500 mb-4">
              Получавай новини и ревюта директно в пощата си.
            </p>
            <NewsletterForm вариант="компактен" />
            <p className="mt-2 text-xs text-gray-400">Без спам. Отпиши се по всяко време.</p>
          </div>
        </aside>

      </div>
    </div>
  )
}
