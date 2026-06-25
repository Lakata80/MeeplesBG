import { notFound }      from 'next/navigation'
import Link              from 'next/link'
import Image             from 'next/image'
import type { Metadata } from 'next'
import { auth }          from '@/auth'
import { prisma }        from '@/lib/prisma'
import { getКатегория }  from '@/lib/obshtnost'
import ReplyForm         from '@/components/obshtnost/ReplyForm'
import SolveButton       from '@/components/obshtnost/SolveButton'
import HelpfulButton     from '@/components/obshtnost/HelpfulButton'
import ModerateButtons   from '@/components/obshtnost/ModerateButtons'

export const dynamic = 'force-dynamic'

type Params = Promise<{ category: string; slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const thread = await prisma.thread.findUnique({ where: { slug }, select: { title: true } })
  return { title: thread ? `${thread.title} | Общност | MeeplesBG` : 'Тема' }
}

const ФОРМАТ_ДАТА = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'long', timeStyle: 'short' })

export default async function ТемаСтраница({ params }: { params: Params }) {
  const { category, slug } = await params
  const кат = getКатегория(category)
  if (!кат) notFound()

  const [thread, session] = await Promise.all([
    prisma.thread.findUnique({
      where:   { slug },
      include: {
        author:  { select: { id: true, name: true, image: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true, image: true } } },
        },
      },
    }),
    auth(),
  ])

  if (!thread || thread.category !== кат.db) notFound()

  const userId   = session?.user?.id
  const userRole = (session?.user as { role?: string })?.role
  const isAdmin  = userRole === 'ADMIN' || userRole === 'MODERATOR'
  const isAuthor = userId === thread.author.id

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      {/* Хлебни трохи */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1.5 flex-wrap">
        <Link href="/obshtnost" className="hover:text-brand-600">Общност</Link>
        <span>›</span>
        <Link href={`/obshtnost/${category}`} className="hover:text-brand-600">{кат.icon} {кат.label}</Link>
        <span>›</span>
        <span className="text-gray-700 truncate max-w-[200px]">{thread.title}</span>
      </nav>

      {/* Модерация */}
      {isAdmin && (
        <div className="mb-4">
          <ModerateButtons threadId={thread.id} isPinned={thread.isPinned} isClosed={thread.isClosed} category={category} />
        </div>
      )}

      {/* Заглавие */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {thread.isPinned && <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">📌 Закачена</span>}
          {thread.isSolved && <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ Решена</span>}
          {thread.isClosed && <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">🔒 Затворена</span>}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>

        {/* Мета за SRESHTI */}
        {кат.db === 'SRESHTI' && (
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-orange-700 bg-orange-50 rounded-xl p-3">
            {thread.eventDate && <span>📅 {ФОРМАТ_ДАТА.format(new Date(thread.eventDate))}</span>}
            {thread.eventCity && <span>📍 {thread.eventCity}</span>}
            {thread.eventSpots && <span>👥 {thread.eventSpots} места</span>}
            {thread.eventClub && <span>🏛️ {thread.eventClub}</span>}
          </div>
        )}

        {/* Мета за PAZAR */}
        {кат.db === 'PAZAR' && thread.price && (
          <div className="mt-3 text-sm font-semibold text-green-700 bg-green-50 rounded-xl p-3">
            💰 {thread.price}
            {thread.expiresAt && (
              <span className="ml-3 font-normal text-gray-500">
                · изтича {ФОРМАТ_ДАТА.format(new Date(thread.expiresAt))}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Оригинална тема */}
      <PostBody
        author={thread.author}
        body={thread.body}
        date={thread.createdAt}
        extra={
          isAuthor && кат.db === 'IZBOR' ? (
            <SolveButton threadId={thread.id} isSolved={thread.isSolved} />
          ) : null
        }
      />

      {/* Отговори */}
      {thread.replies.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {thread.replies.length} {thread.replies.length === 1 ? 'отговор' : 'отговора'}
          </h2>
          {thread.replies.map((reply) => (
            <PostBody
              key={reply.id}
              author={reply.author}
              body={reply.body}
              date={reply.createdAt}
              isHelpful={reply.isHelpful}
              extra={
                isAuthor && кат.db === 'IZBOR' ? (
                  <HelpfulButton threadId={thread.id} replyId={reply.id} isHelpful={reply.isHelpful} />
                ) : null
              }
            />
          ))}
        </div>
      )}

      {/* Форма за отговор */}
      <ReplyForm threadId={thread.id} isClosed={thread.isClosed} isLoggedIn={!!userId} />
    </div>
  )
}

function PostBody({
  author, body, date, isHelpful, extra,
}: {
  author:     { name: string | null; image: string | null }
  body:       string
  date:       Date
  isHelpful?: boolean
  extra?:     React.ReactNode
}) {
  const ФОРМАТ = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className={`rounded-2xl border p-5 ${isHelpful ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-200">
          {author.image ? (
            <Image src={author.image} alt={author.name ?? ''} fill className="object-cover" sizes="36px" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-sm font-bold text-gray-500">
              {(author.name ?? '?')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{author.name ?? 'Анонимен'}</p>
          <p className="text-xs text-gray-400">{ФОРМАТ.format(new Date(date))}</p>
        </div>
        {isHelpful && (
          <span className="ml-auto text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            👍 Полезен
          </span>
        )}
      </div>

      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{body}</div>

      {extra && <div className="mt-4 flex gap-2">{extra}</div>}
    </div>
  )
}
