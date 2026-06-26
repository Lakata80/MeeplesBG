import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

type Params  = { params: Promise<{ id: string }> }
type OrderItem = { entryId: string; position: number }

// POST /api/top9/[id]/reorder
// body: { entries: [{ entryId, position }, ...] }
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const top9 = await prisma.monthlyTop9.findUnique({
    where:  { id },
    select: { userId: true, entries: { select: { id: true } } },
  })
  if (!top9) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (top9.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const items: OrderItem[] = body.entries

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'entries е задължителен масив' }, { status: 400 })
  }

  // Валидация на позиции (уникални, 1–9)
  const positions = items.map((i) => i.position)
  const posSet    = new Set(positions)
  if (posSet.size !== positions.length || positions.some((p) => p < 1 || p > 9)) {
    return NextResponse.json({ error: 'Позициите трябва да са уникални числа от 1 до 9' }, { status: 400 })
  }

  // Валидация: всички entryId принадлежат на този Top 9
  const validIds = new Set(top9.entries.map((e) => e.id))
  for (const { entryId } of items) {
    if (!validIds.has(entryId)) {
      return NextResponse.json({ error: `entryId ${entryId} не принадлежи на този Top 9` }, { status: 400 })
    }
  }

  // Транзакция: временни отрицателни позиции → финални позиции
  // (избягва нарушаване на UNIQUE constraint при размяна)
  await prisma.$transaction(async (tx) => {
    for (const { entryId, position } of items) {
      await tx.monthlyTop9Entry.update({
        where: { id: entryId },
        data:  { position: -position },
      })
    }
    for (const { entryId, position } of items) {
      await tx.monthlyTop9Entry.update({
        where: { id: entryId },
        data:  { position },
      })
    }
  })

  const updated = await prisma.monthlyTop9.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { position: 'asc' },
        include: {
          game: {
            select: {
              id: true, titleBg: true, titleEn: true,
              thumbnailUrl: true, imageUrl: true, slug: true,
            },
          },
        },
      },
    },
  })
  return NextResponse.json(updated)
}
