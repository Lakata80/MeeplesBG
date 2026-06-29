import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

// GET /api/plays?gameId=xxx — играния на логнатия потребител за дадена игра
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const gameId = searchParams.get('gameId')
  if (!gameId) {
    return NextResponse.json({ error: 'Липсва gameId' }, { status: 400 })
  }

  const plays = await prisma.gamePlay.findMany({
    where:   { gameId, userId: session.user.id },
    include: { players: { orderBy: { score: 'desc' } } },
    orderBy: { playedAt: 'desc' },
  })

  return NextResponse.json(plays)
}

// POST /api/plays — запис на нова игра
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { gameId, playedAt, durationMinutes, notes, visibility, players } = body

  if (!gameId) {
    return NextResponse.json({ error: 'Липсва gameId' }, { status: 400 })
  }
  if (!Array.isArray(players) || players.length === 0) {
    return NextResponse.json({ error: 'Добави поне един играч' }, { status: 400 })
  }
  for (const p of players) {
    if (!p.name?.trim()) {
      return NextResponse.json({ error: 'Всеки играч трябва да има име' }, { status: 400 })
    }
  }

  const play = await prisma.gamePlay.create({
    data: {
      gameId,
      userId:          session.user.id,
      playedAt:        playedAt ? new Date(playedAt) : new Date(),
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      notes:           notes?.trim() || null,
      visibility:      visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
      players: {
        create: players.map((p: { name: string; score?: string | number; isWinner?: boolean }) => ({
          name:     p.name.trim(),
          score:    p.score !== '' && p.score != null ? Number(p.score) : null,
          isWinner: p.isWinner ?? false,
        })),
      },
    },
    include: { players: { orderBy: { score: 'desc' } } },
  })

  return NextResponse.json(play, { status: 201 })
}
