import type { NextRequest } from 'next/server'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

// PATCH body: { action: 'pin' | 'unpin' | 'close' | 'open' | 'delete' }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user?.id || (role !== 'ADMIN' && role !== 'MODERATOR')) {
    return Response.json({ грешка: 'Нямаш право.' }, { status: 403 })
  }

  const { id } = await params
  const { action } = await request.json() as { action: string }

  switch (action) {
    case 'pin':
      await prisma.thread.update({ where: { id }, data: { isPinned: true } })
      break
    case 'unpin':
      await prisma.thread.update({ where: { id }, data: { isPinned: false } })
      break
    case 'close':
      await prisma.thread.update({ where: { id }, data: { isClosed: true } })
      break
    case 'open':
      await prisma.thread.update({ where: { id }, data: { isClosed: false } })
      break
    case 'delete':
      await prisma.thread.delete({ where: { id } })
      break
    default:
      return Response.json({ грешка: 'Невалидно действие.' }, { status: 400 })
  }

  return Response.json({ ok: true })
}
