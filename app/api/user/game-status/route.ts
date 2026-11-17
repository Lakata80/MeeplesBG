import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

// GET /api/user/game-status?gameId=xxx — колекционен статус на логнатия потребител
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ collectionStatus: null })
  }

  const { searchParams } = new URL(req.url)
  const gameId = searchParams.get('gameId')
  if (!gameId) {
    return NextResponse.json({ error: 'Липсва gameId' }, { status: 400 })
  }

  const запис = await prisma.userCollection.findUnique({
    where:  { userId_gameId: { userId: session.user.id, gameId } },
    select: { status: true },
  }).catch(() => null)

  return NextResponse.json({ collectionStatus: запис?.status ?? null })
}
