/**
 * Обновява само полето types за всички активни игри от BGG.
 * BGG позволява 20 ID-та наведнъж → ~100 заявки за 2000 игри → ~2 мин.
 * Употреба: npx tsx --env-file=.env --env-file=.env.local scripts/refresh-types.ts
 */

import { PrismaClient } from '@prisma/client'
import { parseBGGGame } from '../lib/bgg/parser'

const prisma = new PrismaClient()

const BGG_BASE = process.env.BGG_API_URL ?? 'https://boardgamegeek.com/xmlapi2'
const TOKEN    = process.env.BGG_API_TOKEN ?? ''
const COOKIE   = process.env.BGG_SESSION_COOKIE ?? ''
const BATCH    = 20   // BGG max per request
const DELAY    = 1200 // ms между заявките

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

async function bggFetch(ids: number[]): Promise<string> {
  const url = `${BGG_BASE}/thing?id=${ids.join(',')}&stats=1`
  const headers: Record<string, string> = {
    'User-Agent': 'MeeplesBG/1.0 (https://meeplesbg.com)',
    'Accept':     'application/xml,text/xml',
    ...(TOKEN  ? { 'Authorization': `Bearer ${TOKEN}` }  : {}),
    ...(COOKIE ? { 'Cookie': COOKIE }                    : {}),
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers })
    if (res.status === 202) { await sleep(5000); continue }
    if (res.ok) return res.text()
    if (attempt < 2) await sleep(Math.pow(2, attempt) * 2000)
    else throw new Error(`BGG HTTP ${res.status}`)
  }
  throw new Error('BGG: изчерпани опити')
}

async function main() {
  // Вземи всички активни игри с bggId
  const игри = await prisma.game.findMany({
    where:   { isActive: true, bggId: { not: null } },
    select:  { id: true, bggId: true },
    orderBy: { bggId: 'asc' },
  })

  console.log(`Игри за обновяване: ${игри.length}`)
  console.log(`Batches: ${Math.ceil(игри.length / BATCH)} × ${BATCH} ID-та\n`)

  let обновени = 0
  let грешки   = 0
  const общо   = Math.ceil(игри.length / BATCH)

  for (let i = 0; i < игри.length; i += BATCH) {
    const batch   = игри.slice(i, i + BATCH)
    const bggIds  = batch.map((г) => г.bggId!)
    const батчНom = Math.floor(i / BATCH) + 1

    process.stdout.write(`\rBatch ${String(батчНom).padStart(3)}/${общо} ...`)

    try {
      if (i > 0) await sleep(DELAY)

      const xml      = await bggFetch(bggIds)
      const детайли  = parseBGGGame(xml)

      // Обнови types за всяка игра в batch-а
      for (const детайл of детайли) {
        const запис = batch.find((г) => г.bggId === детайл.id)
        if (!запис) continue

        await prisma.game.update({
          where: { id: запис.id },
          data:  { types: детайл.types },
        })
        обновени++
      }
    } catch (err) {
      грешки++
      console.error(`\n  Грешка batch ${батчНom}: ${err}`)
    }
  }

  console.log(`\n\n✅ Готово!`)
  console.log(`   Обновени: ${обновени} игри`)
  if (грешки > 0) console.log(`   Грешки:   ${грешки} batch-а`)

  // Покажи резултат
  const тематични = await prisma.game.count({ where: { types: { has: 'Thematic' } } })
  const стратегически = await prisma.game.count({ where: { types: { has: 'Strategy' } } })
  console.log(`\nТематични: ${тематични}, Стратегически: ${стратегически}`)
}

main()
  .catch((err) => { console.error('Грешка:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
