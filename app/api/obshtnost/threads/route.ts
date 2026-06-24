import type { NextRequest } from 'next/server'
import { auth }    from '@/auth'
import { prisma }  from '@/lib/prisma'
import { uniqueSlug } from '@/lib/slug'
import { getКатегория } from '@/lib/obshtnost'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return Response.json({ грешка: 'Невалидни данни.' }, { status: 400 })
  }

  const { title, content, categorySlug, price, eventDate, eventCity, eventSpots, eventClub } = body as Record<string, string>

  if (!title?.trim() || title.trim().length < 5) {
    return Response.json({ грешка: 'Заглавието трябва да е поне 5 символа.' }, { status: 400 })
  }
  if (!content?.trim() || content.trim().length < 10) {
    return Response.json({ грешка: 'Съдържанието трябва да е поне 10 символа.' }, { status: 400 })
  }

  const кат = getКатегория(categorySlug)
  if (!кат) {
    return Response.json({ грешка: 'Невалидна категория.' }, { status: 400 })
  }

  const slug = uniqueSlug(title.trim())

  const expiresAt = кат.db === 'PAZAR'
    ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    : undefined

  const thread = await prisma.thread.create({
    data: {
      slug,
      title:     title.trim(),
      body:      content.trim(),
      category:  кат.db as 'IZBOR' | 'PRAVILA' | 'PAZAR' | 'SRESHTI',
      authorId:  session.user.id,
      price:     кат.db === 'PAZAR' && price ? price.trim() : undefined,
      expiresAt,
      eventDate: кат.db === 'SRESHTI' && eventDate ? new Date(eventDate) : undefined,
      eventCity: кат.db === 'SRESHTI' && eventCity ? eventCity.trim() : undefined,
      eventSpots: кат.db === 'SRESHTI' && eventSpots ? parseInt(eventSpots) : undefined,
      eventClub: кат.db === 'SRESHTI' && eventClub ? eventClub.trim() : undefined,
    },
  })

  return Response.json({ slug: thread.slug, category: categorySlug })
}
