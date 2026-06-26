import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

const GAME_SELECT = {
  id:           true,
  titleBg:      true,
  titleEn:      true,
  thumbnailUrl: true,
  imageUrl:     true,
  slug:         true,
} as const

const ENTRIES_INCLUDE = {
  include: {
    entries: {
      orderBy: { position: 'asc' as const },
      include: { game: { select: GAME_SELECT } },
    },
  },
}

// GET /api/top9               → всички Top 9 на потребителя
// GET /api/top9?month=6&year=2026 → конкретен месец
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const monthParam = searchParams.get('month')
  const yearParam  = searchParams.get('year')

  if (monthParam && yearParam) {
    const month = Number(monthParam)
    const year  = Number(yearParam)

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Невалиден месец' }, { status: 400 })
    }
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return NextResponse.json({ error: 'Невалидна година' }, { status: 400 })
    }

    const top9 = await prisma.monthlyTop9.findUnique({
      where: { userId_month_year: { userId: session.user.id, month, year } },
      ...ENTRIES_INCLUDE,
    })
    return NextResponse.json(top9 ?? null)
  }

  const all = await prisma.monthlyTop9.findMany({
    where:   { userId: session.user.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    ...ENTRIES_INCLUDE,
  })
  return NextResponse.json(all)
}

// POST /api/top9  body: { month, year }
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { month, year } = body

  const m = Number(month)
  const y = Number(year)

  if (!Number.isInteger(m) || m < 1 || m > 12) {
    return NextResponse.json({ error: 'Невалиден месец' }, { status: 400 })
  }
  if (!Number.isInteger(y) || y < 2020 || y > 2100) {
    return NextResponse.json({ error: 'Невалидна година' }, { status: 400 })
  }

  const existing = await prisma.monthlyTop9.findUnique({
    where: { userId_month_year: { userId: session.user.id, month: m, year: y } },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: 'Вече имаш Top 9 за този месец' }, { status: 409 })
  }

  const top9 = await prisma.monthlyTop9.create({
    data: { userId: session.user.id, month: m, year: y },
    ...ENTRIES_INCLUDE,
  })
  return NextResponse.json(top9, { status: 201 })
}
