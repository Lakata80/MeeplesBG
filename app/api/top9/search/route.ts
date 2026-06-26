import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

// GET /api/top9/search?q=catan
// Връща игри от колекцията на потребителя, подходящи за autocomplete
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''

  const results = await prisma.userCollection.findMany({
    where: {
      userId: session.user.id,
      game: q
        ? {
            OR: [
              { titleBg: { contains: q, mode: 'insensitive' } },
              { titleEn: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
    },
    select: {
      game: {
        select: {
          id:           true,
          titleBg:      true,
          titleEn:      true,
          thumbnailUrl: true,
          imageUrl:     true,
          slug:         true,
        },
      },
    },
    take: 12,
    orderBy: { game: { titleBg: 'asc' } },
  })

  return NextResponse.json(results.map((r) => r.game))
}
