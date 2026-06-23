import type { NextRequest } from 'next/server'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

const ВАЛИДНИ_РОЛИ = ['USER', 'MODERATOR', 'ADMIN'] as const
type Роля = typeof ВАЛИДНИ_РОЛИ[number]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })

  const admin = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })
  if (admin?.role !== 'ADMIN') return Response.json({ грешка: 'Забранено.' }, { status: 403 })

  const { id } = await params
  const { role } = await request.json() as { role: Роля }

  if (!ВАЛИДНИ_РОЛИ.includes(role)) {
    return Response.json({ грешка: 'Невалидна роля.' }, { status: 400 })
  }

  // Забрана: администраторът не може да свали собствената си роля
  if (id === session.user.id && role !== 'ADMIN') {
    return Response.json({ грешка: 'Не можеш да смениш собствената си роля.' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where:  { id },
    data:   { role },
    select: { id: true, role: true },
  })

  return Response.json(updated)
}
