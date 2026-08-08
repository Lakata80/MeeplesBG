/**
 * Обновява bggRank за всички игри в базата данни.
 * Пускай еднократно след добавяне на полето: npx ts-node scripts/refresh-bgg-rank.ts
 */

import { PrismaClient } from '@prisma/client'
import { fetchGamesByIds } from '../lib/bgg/client'

const prisma = new PrismaClient()
const BATCH  = 20
const ПАУЗА  = 1200 // ms между заявките към BGG

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const игри = await prisma.game.findMany({
    where:  { bggId: { not: null } },
    select: { id: true, bggId: true, titleEn: true },
    orderBy: { bggRank: { sort: 'asc', nulls: 'last' } },
  })

  console.log(`Намерени ${игри.length} игри с bggId. Обработвам в пакети от ${BATCH}...`)

  let обновени = 0

  for (let i = 0; i < игри.length; i += BATCH) {
    const пачка  = игри.slice(i, i + BATCH)
    const bggIds = пачка.map((г) => г.bggId as number)

    console.log(`\nПакет ${Math.floor(i / BATCH) + 1}/${Math.ceil(игри.length / BATCH)} (${bggIds.length} игри)...`)

    const детайли = await fetchGamesByIds(bggIds)

    for (const д of детайли) {
      const игра = пачка.find((г) => г.bggId === д.id)
      if (!игра) continue

      await prisma.game.update({
        where: { id: игра.id },
        data:  { bggRank: д.bggRank ?? null },
      })
      обновени++

      const ранг = д.bggRank ? `#${д.bggRank}` : 'без ранг'
      console.log(`  ✓ "${игра.titleEn}" → ${ранг}`)
    }

    if (i + BATCH < игри.length) await sleep(ПАУЗА)
  }

  console.log(`\nГотово — обновени ${обновени} игри.`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
