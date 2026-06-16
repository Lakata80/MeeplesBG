import type { NextRequest } from 'next/server'
import { fetchGameById } from '@/lib/bgg/client'
import { prisma }        from '@/lib/prisma'
import { auth }          from '@/auth'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bggId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  const { bggId: bggIdStr } = await params
  const bggId = parseInt(bggIdStr)

  if (isNaN(bggId) || bggId <= 0) {
    return Response.json({ грешка: 'Невалиден BGG ID' }, { status: 400 })
  }

  // 1. Проверка в нашата база
  const съществуваща = await prisma.game.findUnique({
    where: { bggId },
  })

  if (съществуваща) {
    return Response.json({ игра: съществуваща, от: 'база' })
  }

  // 2. Зареди от BGG и запиши
  const bggДанни = await fetchGameById(bggId)

  if (!bggДанни) {
    return Response.json(
      { грешка: `Играта с BGG ID ${bggId} не е намерена` },
      { status: 404 }
    )
  }

  // Намери уникален slug
  let slug = slugify(bggДанни.titleEn) || `game-${bggId}`
  const slugConflict = await prisma.game.findUnique({
    where: { slug },
    select: { bggId: true },
  })
  if (slugConflict) slug = `${slug}-${bggId}`

  const нова = await prisma.game.create({
    data: {
      bggId:         bggДанни.id,
      slug,
      titleBg:       '',
      titleEn:       bggДанни.titleEn,
      descriptionBg: '',
      descriptionEn: bggДанни.descriptionEn.slice(0, 10000),
      yearPublished: bggДанни.yearPublished,
      minPlayers:    bggДанни.minPlayers,
      maxPlayers:    bggДанни.maxPlayers,
      minPlaytime:   bggДанни.minPlaytime,
      maxPlaytime:   bggДанни.maxPlaytime,
      minAge:        bggДанни.minAge,
      weight:        bggДанни.weight,
      bggRating:     bggДанни.bggRating,
      imageUrl:      bggДанни.imageUrl,
      thumbnailUrl:  bggДанни.thumbnailUrl,
      categories:    bggДанни.categories,
      mechanics:     bggДанни.mechanics,
      types:         bggДанни.types,
      isActive:      true,
    },
  })

  return Response.json({ игра: нова, от: 'bgg' }, { status: 201 })
}
