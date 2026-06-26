import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// POST /api/top9/[id]/entries  body: { gameId, playsCount? }
// Position is computed server-side (max existing + 1) to avoid client/DB desync conflicts.
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Load current entries to determine next position and enforce the 9-game limit
  const top9 = await prisma.monthlyTop9.findUnique({
    where:   { id },
    select: {
      userId:  true,
      entries: { select: { position: true }, orderBy: { position: 'desc' }, take: 1 },
      _count:  { select: { entries: true } },
    },
  })
  if (!top9) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (top9.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (top9._count.entries >= 9) {
    return NextResponse.json({ error: 'Top 9 е вече пълен (максимум 9 игри)' }, { status: 422 })
  }

  const body = await req.json()
  const { gameId, playsCount } = body

  if (!gameId || typeof gameId !== 'string') {
    return NextResponse.json({ error: 'gameId е задължителен' }, { status: 400 })
  }

  const plays = playsCount !== undefined && playsCount !== null ? Number(playsCount) : null
  if (plays !== null && (!Number.isInteger(plays) || plays < 1)) {
    return NextResponse.json({ error: 'Броят партии трябва да е положително число' }, { status: 400 })
  }

  // Проверка: играта е в колекцията на потребителя
  const inCollection = await prisma.userCollection.findUnique({
    where:  { userId_gameId: { userId: session.user.id, gameId } },
    select: { id: true },
  })
  if (!inCollection) {
    return NextResponse.json({ error: 'Играта не е в твоята колекция' }, { status: 422 })
  }

  // Position = max existing position + 1 (safe even if positions have gaps)
  const nextPos = (top9.entries[0]?.position ?? 0) + 1

  const entry = await prisma.monthlyTop9Entry.create({
    data: { top9Id: id, gameId, position: nextPos, playsCount: plays },
    include: {
      game: {
        select: {
          id: true, titleBg: true, titleEn: true,
          thumbnailUrl: true, imageUrl: true, slug: true,
        },
      },
    },
  })
  return NextResponse.json(entry, { status: 201 })
}
