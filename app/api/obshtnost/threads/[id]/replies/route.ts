import type { NextRequest } from 'next/server'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import { DB_КЪМ_SLUG } from '@/lib/obshtnost'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  const { id } = await params

  let body: Record<string, string>
  try { body = await request.json() } catch {
    return Response.json({ грешка: 'Невалидни данни.' }, { status: 400 })
  }

  const { content } = body
  if (!content?.trim() || content.trim().length < 2) {
    return Response.json({ грешка: 'Отговорът е твърде кратък.' }, { status: 400 })
  }
  if (content.trim().length > 10_000) {
    return Response.json({ грешка: 'Отговорът не може да надвишава 10 000 символа.' }, { status: 400 })
  }

  const thread = await prisma.thread.findUnique({
    where:  { id },
    select: { id: true, isClosed: true, authorId: true, category: true },
  })

  if (!thread) return Response.json({ грешка: 'Темата не е намерена.' }, { status: 404 })
  if (thread.isClosed) return Response.json({ грешка: 'Темата е затворена.' }, { status: 403 })

  const reply = await prisma.threadReply.create({
    data: { body: content.trim(), threadId: id, authorId: session.user.id },
  })

  await prisma.thread.update({ where: { id }, data: { updatedAt: new Date() } })

  // Известие към автора на темата (ако не е той самият)
  if (thread.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId:   thread.authorId,
        type:     'THREAD_REPLY',
        threadId: id,
        replyId:  reply.id,
      },
    })
  }

  return Response.json({ ok: true, categorySlug: DB_КЪМ_SLUG[thread.category] })
}
