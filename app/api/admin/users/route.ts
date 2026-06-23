import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'ADMIN') return Response.json({ грешка: 'Забранено.' }, { status: 403 })

  const потребители = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, image: true,
      role: true, createdAt: true,
      _count: { select: { pendingImages: true, reviews: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(потребители)
}
