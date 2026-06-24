import { NextResponse }  from 'next/server'
import { auth }          from '@/auth'
import { prisma }        from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const review = await prisma.review.findUnique({
    where:  { id },
    select: { userId: true },
  })
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwn   = review.userId === session.user.id
  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'
  if (!isOwn && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.review.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const review = await prisma.review.findUnique({
    where:  { id },
    select: { userId: true },
  })
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (review.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, content, rating, audience, playedWith, realPlaytime } = body

  const r = rating !== undefined ? Number(rating) : undefined
  if (r !== undefined && (!Number.isInteger(r) || r < 1 || r > 10)) {
    return NextResponse.json({ error: 'Оценката трябва да е от 1 до 10' }, { status: 400 })
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...(title    !== undefined && { title:       title.trim() }),
      ...(content  !== undefined && { content:     content.trim() }),
      ...(r        !== undefined && { rating:      r }),
      audience:    audience    !== undefined ? (audience?.trim()    || null) : undefined,
      playedWith:  playedWith  !== undefined ? (playedWith?.trim()  || null) : undefined,
      realPlaytime: realPlaytime !== undefined ? (realPlaytime ? Number(realPlaytime) : null) : undefined,
    },
  })

  return NextResponse.json(updated)
}
