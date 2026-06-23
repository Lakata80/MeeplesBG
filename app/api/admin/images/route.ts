import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'ADMIN') return Response.json({ грешка: 'Забранено.' }, { status: 403 })

  const pending = await prisma.pendingImage.findMany({
    where:   { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    include: {
      game: { select: { titleBg: true, titleEn: true, slug: true } },
      user: { select: { email: true, name: true } },
    },
  })

  return Response.json(pending)
}
