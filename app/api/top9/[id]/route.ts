import { NextResponse } from 'next/server'
import { auth }         from '@/auth'
import { prisma }       from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/top9/[id]  body: { isPublic }
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const top9 = await prisma.monthlyTop9.findUnique({
    where:  { id },
    select: { userId: true },
  })
  if (!top9) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (top9.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { isPublic } = await req.json()
  if (typeof isPublic !== 'boolean') {
    return NextResponse.json({ error: 'isPublic трябва да е boolean' }, { status: 400 })
  }

  const updated = await prisma.monthlyTop9.update({
    where: { id },
    data:  { isPublic },
    select: { id: true, isPublic: true, shareToken: true },
  })
  return NextResponse.json(updated)
}

// DELETE /api/top9/[id]
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const top9 = await prisma.monthlyTop9.findUnique({
    where:  { id },
    select: { userId: true },
  })
  if (!top9) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (top9.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.monthlyTop9.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
