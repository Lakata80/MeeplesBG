import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'
import { DB_КЪМ_SLUG } from '@/lib/obshtnost'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  const notifications = await prisma.notification.findMany({
    where:   { userId: session.user.id, isRead: false },
    orderBy: { createdAt: 'desc' },
    take:    20,
    include: {
      thread: { select: { slug: true, title: true, category: true } },
    },
  })

  return Response.json(notifications.map((n) => ({
    ...n,
    categorySlug: n.thread ? DB_КЪМ_SLUG[n.thread.category] : null,
  })))
}

export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data:  { isRead: true },
  })

  return Response.json({ ok: true })
}
