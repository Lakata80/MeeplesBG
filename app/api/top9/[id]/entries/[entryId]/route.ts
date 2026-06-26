import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

type Params = { params: Promise<{ id: string; entryId: string }> }

async function resolveOwnership(top9Id: string, entryId: string, userId: string) {
  const entry = await prisma.monthlyTop9Entry.findFirst({
    where: { id: entryId, top9Id },
    include: { top9: { select: { userId: true } } },
  })
  return entry
}

// PATCH /api/top9/[id]/entries/[entryId]  body: { playsCount?, position? }
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, entryId } = await params
  const entry = await resolveOwnership(id, entryId, session.user.id)
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (entry.top9.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const updateData: { playsCount?: number | null; position?: number } = {}

  if ('playsCount' in body) {
    const plays = body.playsCount !== null ? Number(body.playsCount) : null
    if (plays !== null && (!Number.isInteger(plays) || plays < 1)) {
      return NextResponse.json({ error: 'Броят партии трябва да е положително число' }, { status: 400 })
    }
    updateData.playsCount = plays
  }

  if ('position' in body) {
    const pos = Number(body.position)
    if (!Number.isInteger(pos) || pos < 1 || pos > 9) {
      return NextResponse.json({ error: 'Позицията трябва да е от 1 до 9' }, { status: 400 })
    }
    updateData.position = pos
  }

  const updated = await prisma.monthlyTop9Entry.update({
    where: { id: entryId },
    data:  updateData,
    include: {
      game: {
        select: {
          id: true, titleBg: true, titleEn: true,
          thumbnailUrl: true, imageUrl: true, slug: true,
        },
      },
    },
  })
  return NextResponse.json(updated)
}

// DELETE /api/top9/[id]/entries/[entryId]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, entryId } = await params
  const entry = await resolveOwnership(id, entryId, session.user.id)
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (entry.top9.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.monthlyTop9Entry.delete({ where: { id: entryId } })
  return NextResponse.json({ ok: true })
}
