import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

// DELETE /api/plays/[id] — изтриване на запис (само собственик)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const play = await prisma.gamePlay.findUnique({
    where:  { id },
    select: { userId: true },
  })

  if (!play) {
    return NextResponse.json({ error: 'Не е намерено' }, { status: 404 })
  }
  if (play.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.gamePlay.delete({ where: { id } })

  return new NextResponse(null, { status: 204 })
}
