import Image  from 'next/image'
import Link   from 'next/link'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import ReviewForm from './ReviewForm'
import ReviewActions from './ReviewActions'

interface Props {
  gameId: string
}

export default async function ReviewSection({ gameId }: Props) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN'

  const reviews = await prisma.review.findMany({
    where:   { gameId, isPublished: true },
    include: { user: { select: { id: true, name: true, image: true, bggUsername: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const average = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  const myReview = userId
    ? reviews.find((r) => r.user.id === userId) ?? null
    : null

  const ДАТА = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium' })

  return (
    <section id="reviews" className="py-8 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Заглавие + средна оценка */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            ✍️ Ревюта от общността
            {reviews.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">({reviews.length})</span>
            )}
          </h2>
          {average !== null && (
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-4 py-2">
              <span className="text-2xl font-bold text-brand-600">{average.toFixed(1)}</span>
              <div className="text-xs text-gray-600 leading-tight">
                <p className="font-medium">Средна оценка</p>
                <p className="text-gray-400">от MeeplesBG общността</p>
              </div>
            </div>
          )}
        </div>

        {/* Форма за ново ревю (ако потребителят е влязъл и няма ревю) */}
        {userId && !myReview && (
          <div className="mb-8 bg-gray-50 rounded-2xl border border-gray-200 p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Напиши ревю</h3>
            <ReviewForm gameId={gameId} />
          </div>
        )}

        {!userId && (
          <div className="mb-8 bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-sm text-gray-600 mb-3">
              <Link href="/login" className="text-brand-600 font-medium hover:underline">Влез в профила си</Link>{' '}
              за да напишеш ревю.
            </p>
          </div>
        )}

        {/* Списък с ревюта */}
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            Все още няма ревюта за тази игра. Бъди първият!
          </p>
        ) : (
          <div className="space-y-5">
            {reviews.map((r) => {
              const профилUrl = `/potrebiteli/${encodeURIComponent(r.user.bggUsername ?? r.user.id)}`
              const isOwner   = r.user.id === userId
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-5 ${isOwner ? 'border-brand-200 bg-brand-50/30' : 'border-gray-200 bg-white'}`}
                >
                  {/* Хедър */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <Link href={профилUrl} className="flex items-center gap-2 min-w-0">
                      {r.user.image ? (
                        <Image
                          src={r.user.image}
                          alt={r.user.name ?? ''}
                          width={36}
                          height={36}
                          className="rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-600 flex-shrink-0">
                          {(r.user.name ?? r.user.bggUsername ?? '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate hover:text-brand-600 transition-colors">
                          {r.user.name ?? r.user.bggUsername ?? 'Потребител'}
                        </p>
                        <p className="text-xs text-gray-400">{ДАТА.format(new Date(r.createdAt))}</p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-lg px-2.5 py-1">
                        {r.rating}/10
                      </span>
                      {(isOwner || isAdmin) && (
                        <ReviewActions reviewId={r.id} isOwner={isOwner} isAdmin={isAdmin} />
                      )}
                    </div>
                  </div>

                  {/* Заглавие */}
                  <h4 className="font-semibold text-gray-900 mb-2">{r.title}</h4>

                  {/* Текст */}
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-3">{r.content}</p>

                  {/* Незадължителни мета */}
                  {(r.audience || r.playedWith || r.realPlaytime) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {r.audience && (
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                          👥 За кого: {r.audience}
                        </span>
                      )}
                      {r.playedWith && (
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                          🎮 С кого: {r.playedWith}
                        </span>
                      )}
                      {r.realPlaytime && (
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                          ⏱ Реално: {r.realPlaytime} мин.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
