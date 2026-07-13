/**
 * Показва игрите, импортирани след първоначалния bulk import (2026-06-19).
 * Игрите без преведено заглавие или описание на български.
 */
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  const total = await p.game.count()
  console.log(`\nОбщо игри в базата: ${total}`)

  // Игри импортирани след bulk import-а (след 2026-06-19)
  const cutoff = new Date('2026-06-20T00:00:00Z')

  const newGames = await p.game.findMany({
    where: {
      createdAt: { gte: cutoff },
      isActive: true,
    },
    select: {
      bggId: true,
      slug: true,
      titleEn: true,
      titleBg: true,
      descriptionBg: true,
      bggRating: true,
      yearPublished: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log(`\nНови игри (след 2026-06-19): ${newGames.length}`)
  console.log('─'.repeat(80))

  for (const г of newGames) {
    const titleTranslated = г.titleBg !== г.titleEn ? '✅ заглавие' : '❌ заглавие'
    const descTranslated  = г.descriptionBg && г.descriptionBg.length > 10 ? '✅ описание' : '❌ описание'
    const date = г.createdAt.toISOString().slice(0, 10)
    console.log(`[${date}] BGG:${г.bggId} | ${titleTranslated} | ${descTranslated} | ${г.titleEn}`)
  }

  // Обобщение
  const needsTitle = newGames.filter(г => г.titleBg === г.titleEn)
  const needsDesc  = newGames.filter(г => !г.descriptionBg || г.descriptionBg.length <= 10)

  console.log('\n─'.repeat(80))
  console.log(`Нуждаят се от превод на заглавие: ${needsTitle.length}`)
  console.log(`Нуждаят се от превод на описание:  ${needsDesc.length}`)

  if (needsTitle.length > 0) {
    console.log('\nЗаглавия без превод:')
    for (const г of needsTitle) {
      console.log(`  BGG:${г.bggId} | https://meeplesbg.com/igri/${г.slug}`)
      console.log(`    EN: ${г.titleEn}`)
    }
  }
}

main().finally(() => p.$disconnect())
