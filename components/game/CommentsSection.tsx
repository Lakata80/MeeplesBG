import { prisma } from '@/lib/prisma'
import CommentList, { type КоментарData } from './CommentList'
import CommentForm from './CommentForm'

interface Props {
  gameId: string
  slug: string
  влязъл: boolean
}

export default async function CommentsSection({ gameId, slug, влязъл }: Props) {
  const коментари = await prisma.comment.findMany({
    where:   { gameId, isApproved: true, parentId: null },
    include: {
      user:    { select: { name: true, image: true } },
      replies: {
        where:   { isApproved: true },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take:    30,
  })

  // Конвертирай Date → string за клиентския компонент
  const данни: КоментарData[] = коментари.map((к) => ({
    id:        к.id,
    content:   к.content,
    createdAt: к.createdAt.toISOString(),
    user:      { name: к.user.name, image: к.user.image },
    replies:   к.replies.map((р) => ({
      id:        р.id,
      content:   р.content,
      createdAt: р.createdAt.toISOString(),
      user:      { name: р.user.name, image: р.user.image },
    })),
  }))

  return (
    <section className="py-8 border-t border-gray-100">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          💬 Коментари{коментари.length > 0 && ` (${коментари.length})`}
        </h2>

        {/* Форма за нов коментар */}
        <div className="mb-8">
          <CommentForm gameId={gameId} slug={slug} />
        </div>

        {/* Списък коментари */}
        <CommentList коментари={данни} gameId={gameId} slug={slug} />
      </div>
    </section>
  )
}
