import { prisma }           from '@/lib/prisma'
import BlogCommentList,
  { type БлогКоментарData } from './BlogCommentList'
import BlogCommentForm       from './BlogCommentForm'

interface Props {
  postSlug: string
}

type DbКоментар = {
  id: string
  content: string
  createdAt: Date
  user: { name: string | null; image: string | null }
  replies: {
    id: string
    content: string
    createdAt: Date
    user: { name: string | null; image: string | null }
  }[]
}

export default async function BlogCommentsSection({ postSlug }: Props) {
  let dbКоментари: DbКоментар[] = []
  try {
    dbКоментари = await prisma.blogComment.findMany({
      where: {
        postSlug,
        isApproved: true,
        parentId:   null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, content: true, createdAt: true,
        user: { select: { name: true, image: true } },
        replies: {
          where:   { isApproved: true },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true, content: true, createdAt: true,
            user: { select: { name: true, image: true } },
          },
        },
      },
    })
  } catch {
    // DB не е достъпна при build time; ISR ще регенерира при първото посещение
  }

  // Сериализиране на Date → ISO string преди подаване на Client Component
  const коментари: БлогКоментарData[] = dbКоментари.map((к) => ({
    ...к,
    createdAt: к.createdAt.toISOString(),
    replies:   к.replies.map((р) => ({
      ...р,
      createdAt: р.createdAt.toISOString(),
    })),
  }))

  const брой = коментари.length + коментари.reduce((s, к) => s + к.replies.length, 0)

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Коментари {брой > 0 && <span className="text-gray-400 font-normal text-base">({брой})</span>}
      </h2>

      <div className="mb-8">
        <BlogCommentForm postSlug={postSlug} />
      </div>

      <BlogCommentList коментари={коментари} postSlug={postSlug} />
    </section>
  )
}
