import type { NextRequest } from 'next/server'
import { auth }    from '@/auth'
import { prisma }  from '@/lib/prisma'
import { uniqueSlug } from '@/lib/slug'
import { getКатегория, EVENT_TYPES } from '@/lib/obshtnost'
import type { EventType } from '@prisma/client'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return Response.json({ грешка: 'Невалидни данни.' }, { status: 400 })
  }

  const { title, content, categorySlug, price, eventType, eventDate, eventEndDate, eventCity, eventSpots, eventClub } = body as Record<string, string>
  const images = Array.isArray(body.images) ? (body.images as string[]).slice(0, 3) : []

  if (!title?.trim() || title.trim().length < 5) {
    return Response.json({ грешка: 'Заглавието трябва да е поне 5 символа.' }, { status: 400 })
  }
  if (title.trim().length > 300) {
    return Response.json({ грешка: 'Заглавието не може да надвишава 300 символа.' }, { status: 400 })
  }
  if (!content?.trim() || content.trim().length < 10) {
    return Response.json({ грешка: 'Съдържанието трябва да е поне 10 символа.' }, { status: 400 })
  }
  if (content.trim().length > 10_000) {
    return Response.json({ грешка: 'Съдържанието не може да надвишава 10 000 символа.' }, { status: 400 })
  }

  const кат = getКатегория(categorySlug)
  if (!кат) {
    return Response.json({ грешка: 'Невалидна категория.' }, { status: 400 })
  }

  const slug = uniqueSlug(title.trim())

  const expiresAt = кат.db === 'PAZAR'
    ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    : undefined

  // Validate SRESHTI fields
  let parsedEventType: EventType | undefined
  let parsedEventDate: Date | undefined
  let parsedEventEndDate: Date | undefined

  if (кат.db === 'SRESHTI') {
    if (!eventType || !(eventType in EVENT_TYPES)) {
      return Response.json({ грешка: 'Моля изберете тип събитие.' }, { status: 400 })
    }
    parsedEventType = eventType as EventType

    if (eventDate) {
      parsedEventDate = new Date(eventDate)
      if (isNaN(parsedEventDate.getTime())) {
        return Response.json({ грешка: 'Невалидна начална дата.' }, { status: 400 })
      }
      if (parsedEventDate <= new Date()) {
        return Response.json({ грешка: 'Началната дата трябва да е в бъдещето.' }, { status: 400 })
      }
    }

    if (eventEndDate) {
      parsedEventEndDate = new Date(eventEndDate)
      if (isNaN(parsedEventEndDate.getTime())) {
        return Response.json({ грешка: 'Невалидна крайна дата.' }, { status: 400 })
      }
      if (parsedEventDate && parsedEventEndDate < parsedEventDate) {
        return Response.json({ грешка: 'Крайната дата трябва да е след началната.' }, { status: 400 })
      }
    }
  }

  let thread: { slug: string }
  try {
    thread = await prisma.thread.create({
      data: {
        slug,
        title:        title.trim(),
        body:         content.trim(),
        category:     кат.db as 'IZBOR' | 'PRAVILA' | 'PAZAR' | 'SRESHTI',
        authorId:     session.user.id,
        price:        кат.db === 'PAZAR' && price ? price.trim() : undefined,
        images:       кат.db === 'PAZAR' ? images : [],
        expiresAt,
        eventType:    parsedEventType,
        eventDate:    parsedEventDate,
        eventEndDate: parsedEventEndDate,
        eventCity:    кат.db === 'SRESHTI' && eventCity ? eventCity.trim() : undefined,
        eventSpots:   кат.db === 'SRESHTI' && eventSpots ? parseInt(eventSpots) : undefined,
        eventClub:    кат.db === 'SRESHTI' && eventClub ? eventClub.trim() : undefined,
      },
    })
  } catch (err) {
    console.error('[threads/POST] prisma error:', err)
    return Response.json({ грешка: 'Грешка при запис. Провери данните и опитай отново.' }, { status: 500 })
  }

  return Response.json({ slug: thread.slug, category: categorySlug })
}
