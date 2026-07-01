import { NextResponse }  from 'next/server'
import { auth }          from '@/auth'
import { prisma }        from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { gameId, title, content, rating, audience, playedWith, realPlaytime } = body

  if (!gameId || !title?.trim() || !content?.trim() || !rating) {
    return NextResponse.json({ error: 'Липсват задължителни полета' }, { status: 400 })
  }
  if (title.trim().length > 300) {
    return NextResponse.json({ error: 'Заглавието не може да надвишава 300 символа' }, { status: 400 })
  }
  if (content.trim().length > 10_000) {
    return NextResponse.json({ error: 'Текстът не може да надвишава 10 000 символа' }, { status: 400 })
  }
  if (audience && audience.trim().length > 200) {
    return NextResponse.json({ error: 'Полето "Аудитория" не може да надвишава 200 символа' }, { status: 400 })
  }
  if (playedWith && playedWith.trim().length > 200) {
    return NextResponse.json({ error: 'Полето "Изиграно с" не може да надвишава 200 символа' }, { status: 400 })
  }

  const r = Number(rating)
  if (!Number.isInteger(r) || r < 1 || r > 10) {
    return NextResponse.json({ error: 'Оценката трябва да е от 1 до 10' }, { status: 400 })
  }

  const existing = await prisma.review.findUnique({
    where: { userId_gameId: { userId: session.user.id, gameId } },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: 'Вече имаш ревю за тази игра' }, { status: 409 })
  }

  const review = await prisma.review.create({
    data: {
      userId:      session.user.id,
      gameId,
      title:       title.trim(),
      content:     content.trim(),
      rating:      r,
      audience:    audience?.trim() || null,
      playedWith:  playedWith?.trim() || null,
      realPlaytime: realPlaytime ? Number(realPlaytime) : null,
      isPublished: true,
    },
  })

  return NextResponse.json(review, { status: 201 })
}
