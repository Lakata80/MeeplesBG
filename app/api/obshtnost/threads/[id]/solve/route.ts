import type { NextRequest } from 'next/server'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  const { id } = await params
  const thread = await prisma.thread.findUnique({
    where:  { id },
    select: { authorId: true, category: true, isSolved: true },
  })

  if (!thread) return Response.json({ грешка: 'Не е намерена.' }, { status: 404 })
  if (thread.category !== 'IZBOR') return Response.json({ грешка: 'Само за категория Избор.' }, { status: 400 })

  const isOwner = thread.authorId === session.user.id
  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'
  if (!isOwner && !isAdmin) return Response.json({ грешка: 'Нямаш право.' }, { status: 403 })

  const updated = await prisma.thread.update({
    where: { id },
    data:  { isSolved: !thread.isSolved },
  })

  return Response.json({ isSolved: updated.isSolved })
}
