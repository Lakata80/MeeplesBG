import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

const GAME_SELECT = {
  id:           true,
  slug:         true,
  titleBg:      true,
  titleEn:      true,
  imageUrl:     true,
  thumbnailUrl: true,
  yearPublished: true,
  bggRating:    true,
} as const

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })
  return user?.role === 'ADMIN' ? session : null
}

// GET /api/admin/featured?type=HIDDEN_GEM
// GET /api/admin/featured?search=query  (търсене за picker)
export async function GET(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return Response.json({ грешка: 'Забранено.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim()

  // Режим на търсене — за picker-а
  if (search) {
    const игри = await prisma.game.findMany({
      where: {
        isActive: true,
        OR: [
          { titleBg: { contains: search, mode: 'insensitive' } },
          { titleEn: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: GAME_SELECT,
      orderBy: { titleBg: 'asc' },
      take: 8,
    })
    return Response.json(игри)
  }

  // Режим за текущи Hidden Gems
  const gems = await prisma.featuredContent.findMany({
    where:   { type: 'HIDDEN_GEM', isActive: true },
    orderBy: { position: 'asc' },
    include: { game: { select: GAME_SELECT } },
  })

  return Response.json(gems)
}

// POST /api/admin/featured  { gameId, type }
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return Response.json({ грешка: 'Забранено.' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const { gameId, type = 'HIDDEN_GEM' } = body ?? {}

  if (!gameId || typeof gameId !== 'string') {
    return Response.json({ грешка: 'Липсва gameId.' }, { status: 400 })
  }

  const броЗаписи = await prisma.featuredContent.count({
    where: { type, isActive: true },
  })
  if (броЗаписи >= 4) {
    return Response.json({ грешка: 'Максимум 4 скрити находки.' }, { status: 400 })
  }

  // Проверка за дублирано
  const съществуващ = await prisma.featuredContent.findFirst({
    where: { gameId, type, isActive: true },
  })
  if (съществуващ) {
    return Response.json({ грешка: 'Тази игра вече е добавена.' }, { status: 400 })
  }

  const запис = await prisma.featuredContent.create({
    data: { type, gameId, position: броЗаписи },
    include: { game: { select: GAME_SELECT } },
  })

  return Response.json(запис, { status: 201 })
}
