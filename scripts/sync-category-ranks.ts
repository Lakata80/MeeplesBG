/**
 * Синхронизира BGG категорийните рангове (wargames, strategygames, familygames)
 * и общия bggRank за всички игри в БД с bggId.
 *
 * Стартирай ръчно когато искаш да опресниш класациите:
 *   npx tsx scripts/sync-category-ranks.ts
 */

import { PrismaClient } from '@prisma/client'
import { fetchGamesByIds } from '../lib/bgg/client'

const prisma = new PrismaClient()
const BATCH  = 20

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const игри = await prisma.game.findMany({
    where:   { bggId: { not: null } },
    select:  { id: true, bggId: true, titleEn: true },
    orderBy: { bggRank: { sort: 'asc', nulls: 'last' } },
  })

  console.log(`Намерени ${игри.length} игри с bggId. Обработвам в пакети от ${BATCH}...`)
  console.log('Очаквано времетраене: ~', Math.ceil(игри.length / BATCH * 1.2), 'секунди\n')

  let обновени = 0
  let грешки   = 0

  for (let i = 0; i < игри.length; i += BATCH) {
    const пачка  = игри.slice(i, i + BATCH)
    const bggIds = пачка.map((г) => г.bggId as number)
    const общо   = Math.ceil(игри.length / BATCH)
    const текущ  = Math.floor(i / BATCH) + 1

    process.stdout.write(`Пакет ${текущ}/${общо}... `)

    try {
      const детайли = await fetchGamesByIds(bggIds)

      for (const д of детайли) {
        const игра = пачка.find((г) => г.bggId === д.id)
        if (!игра) continue

        const cr = д.categoryRanks ?? {}

        await prisma.game.update({
          where: { id: игра.id },
          data:  {
            bggRank:         д.bggRank          ?? null,
            bggWargamesRank: cr['wargames']      ?? null,
            bggStrategyRank: cr['strategygames'] ?? null,
            bggFamilyRank:   cr['familygames']   ?? null,
          },
        })
        обновени++
      }

      console.log(`✓ (${детайли.length} игри)`)
    } catch (err) {
      грешки++
      console.log(`✗ грешка: ${err instanceof Error ? err.message : err}`)
    }

    if (i + BATCH < игри.length) await sleep(200)
  }

  console.log(`\nГотово — обновени: ${обновени}, грешки: ${грешки}`)
  console.log('Класациите сега отговарят на BGG.')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
