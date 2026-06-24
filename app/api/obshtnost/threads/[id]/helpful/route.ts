import type { NextRequest } from 'next/server'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/obshtnost/threads/[id]/helpful?replyId=xxx
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  const { id } = await params
  const replyId = req.nextUrl.searchParams.get('replyId')
  if (!replyId) return Response.json({ грешка: 'Липсва replyId.' }, { status: 400 })

  const thread = await prisma.thread.findUnique({
    where:  { id },
    select: { authorId: true, category: true },
  })

  if (!thread) return Response.json({ грешка: 'Не е намерена.' }, { status: 404 })
  if (thread.category !== 'IZBOR') return Response.json({ грешка: 'Само за категория Избор.' }, { status: 400 })
  if (thread.authorId !== session.user.id) return Response.json({ грешка: 'Само авторът може да маркира.' }, { status: 403 })

  const reply = await prisma.threadReply.findUnique({
    where:  { id: replyId },
    select: { isHelpful: true },
  })
  if (!reply) return Response.json({ грешка: 'Отговорът не е намерен.' }, { status: 404 })

  const updated = await prisma.threadReply.update({
    where: { id: replyId },
    data:  { isHelpful: !reply.isHelpful },
  })

  return Response.json({ isHelpful: updated.isHelpful })
}
