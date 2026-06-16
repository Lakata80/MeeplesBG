import type { NextRequest }                           from 'next/server'
import { auth }                                        from '@/auth'
import { prisma }                                      from '@/lib/prisma'
import { fetchGameCollection, fetchGamesByIds }        from '@/lib/bgg/client'
import type { CollectionStatus }                       from '@prisma/client'
import { slugify }                                     from '@/lib/utils'

export const dynamic = 'force-dynamic'

// ── Статус от BGG данни ─────────────────────────────────────────
// Приоритет: притежаван > за продажба > играл > иска да играе
function bggСтатус(item: {
  owned: boolean
  prevOwned: boolean
  forTrade: boolean
  wantToPlay: boolean
  wishlist: boolean
}): CollectionStatus {
  if (item.owned)      return 'OWNS'
  if (item.forTrade)   return 'FORSALE'
  if (item.prevOwned)  return 'PLAYED'
  return 'WISHLIST'
}

// ── Намери уникален slug в базата ──────────────────────────────
async function уникаленСлъг(titleEn: string, bggId: number): Promise<string> {
  const base = slugify(titleEn) || `game-${bggId}`
  const взет = await prisma.game.findUnique({ where: { slug: base }, select: { bggId: true } })
  if (!взет || взет.bggId === bggId) return base
  return `${base}-${bggId}`
}

// ── GET /api/bgg/import-collection?bggUsername=xxx ──────────────
// Streaming SSE — клиентът се свързва с EventSource
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Не сте влезли в акаунт.' }, { status: 401 })
  }

  const bggUsername = req.nextUrl.searchParams.get('bggUsername')?.trim()
  if (!bggUsername) {
    return Response.json({ грешка: 'Липсва BGG потребителско име.' }, { status: 400 })
  }

  const userId = session.user.id
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const изпрати = (данни: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(данни)}\n\n`))
      }

      try {
        // ── 1. Зареди колекцията от BGG ──────────────────────
        изпрати({ тип: 'прогрес', съобщение: `Зареждам колекцията на "${bggUsername}" от BGG...` })

        const items = await fetchGameCollection(bggUsername)

        if (items.length === 0) {
          изпрати({ тип: 'грешка', съобщение: `BGG потребителят "${bggUsername}" няма публична колекция или не съществува.` })
          controller.close()
          return
        }

        изпрати({
          тип: 'прогрес',
          съобщение: `Намерени ${items.length} игри. Проверявам базата данни...`,
          общо: items.length,
        })

        // ── 2. Разделяме на познати / нови ────────────────────
        const bggIds = items.map((i) => i.id)

        const познати = await prisma.game.findMany({
          where:  { bggId: { in: bggIds } },
          select: { id: true, bggId: true },
        })
        const познатиMap = new Map(познати.map((g) => [g.bggId!, g.id]))

        const новиBggIds = bggIds.filter((id) => !познатиMap.has(id))

        // ── 3. Зареди непознатите игри от BGG ─────────────────
        let новиЗаБаза = 0
        if (новиBggIds.length > 0) {
          изпрати({
            тип: 'прогрес',
            съобщение: `Зареждам детайли за ${новиBggIds.length} нови игри от BGG...`,
          })

          const BATCH = 200
          for (let i = 0; i < новиBggIds.length; i += BATCH) {
            const пакет   = новиBggIds.slice(i, i + BATCH)
            const детайли = await fetchGamesByIds(пакет)

            for (const игра of детайли) {
              if (игра.isExpansion) continue
              try {
                const slug = await уникаленСлъг(игра.titleEn, игра.id)
                const нова = await prisma.game.upsert({
                  where:  { bggId: игра.id },
                  update: {},
                  create: {
                    bggId:         игра.id,
                    slug,
                    titleBg:       игра.titleEn,   // временно; ще се превежда
                    titleEn:       игра.titleEn,
                    descriptionEn: игра.descriptionEn.slice(0, 10_000),
                    yearPublished: игра.yearPublished,
                    minPlayers:    игра.minPlayers,
                    maxPlayers:    игра.maxPlayers,
                    minPlaytime:   игра.minPlaytime,
                    maxPlaytime:   игра.maxPlaytime,
                    minAge:        игра.minAge,
                    weight:        игра.weight,
                    bggRating:     игра.bggRating,
                    imageUrl:      игра.imageUrl,
                    thumbnailUrl:  игра.thumbnailUrl,
                    categories:    игра.categories,
                    mechanics:     игра.mechanics,
                    types:         игра.types,
                    isActive:      true,
                  },
                  select: { id: true, bggId: true },
                })
                познатиMap.set(игра.id, нова.id)
                новиЗаБаза++
              } catch {
                // Пропускаме игра, ако записът не успее
              }
            }

            if (i + BATCH < новиBggIds.length) {
              изпрати({
                тип: 'прогрес',
                съобщение: `Записани ${Math.min(i + BATCH, новиBggIds.length)} / ${новиBggIds.length} нови игри...`,
              })
            }
          }
        }

        // ── 4. Запиши bggUsername в потребителя ───────────────
        await prisma.user.update({
          where: { id: userId },
          data:  { bggUsername },
        })

        // ── 5. Обработи UserCollection ────────────────────────
        изпрати({ тип: 'прогрес', съобщение: 'Обновявам личната ти колекция...' })

        let добавени     = 0
        let вечеВКолекция = 0

        for (const item of items) {
          const gameId = познатиMap.get(item.id)
          if (!gameId) continue   // играта не беше добавена (разширение / грешка)

          const статус = bggСтатус(item)

          const съществуваща = await prisma.userCollection.findUnique({
            where:  { userId_gameId: { userId, gameId } },
            select: { id: true },
          })

          if (съществуваща) {
            // Обнови статуса и брой изигравания
            await prisma.userCollection.update({
              where: { userId_gameId: { userId, gameId } },
              data: {
                status:    статус,
                playCount: item.numPlays,
                rating:    item.userRating ? Math.round(item.userRating) : undefined,
              },
            })
            вечеВКолекция++
          } else {
            await prisma.userCollection.create({
              data: {
                userId,
                gameId,
                status:    статус,
                playCount: item.numPlays,
                rating:    item.userRating ? Math.round(item.userRating) : undefined,
              },
            })
            добавени++
          }
        }

        // ── 6. Финален резултат ───────────────────────────────
        изпрати({
          тип: 'завършен',
          добавени,
          вечеВКолекция,
          новиЗаБаза,
          съобщение: `Импортът е завършен успешно!`,
        })

      } catch (грешка) {
        изпрати({
          тип: 'грешка',
          съобщение: грешка instanceof Error ? грешка.message : 'Неизвестна грешка при импорта.',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',   // изключва Nginx буфериране
    },
  })
}
