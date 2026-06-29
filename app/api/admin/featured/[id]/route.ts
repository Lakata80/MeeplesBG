import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })
  return user?.role === 'ADMIN' ? session : null
}

// DELETE /api/admin/featured/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if (!admin) return Response.json({ грешка: 'Забранено.' }, { status: 403 })

  const { id } = await params

  const запис = await prisma.featuredContent.findUnique({ where: { id } })
  if (!запис) return Response.json({ грешка: 'Не е намерен.' }, { status: 404 })

  await prisma.featuredContent.delete({ where: { id } })

  // Нормализиране на position за останалите от същия тип
  const останали = await prisma.featuredContent.findMany({
    where:   { type: запис.type, isActive: true },
    orderBy: { position: 'asc' },
  })
  await Promise.all(
    останали.map((з, i) =>
      prisma.featuredContent.update({ where: { id: з.id }, data: { position: i } }),
    ),
  )

  return new Response(null, { status: 204 })
}
