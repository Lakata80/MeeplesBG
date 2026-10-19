/**
 * Поправя грешки в превода на описанието на „Gay Dating Game".
 * Употреба: npx tsx --env-file=.env scripts/fix-gay-dating-game.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ЗАМЕНИ: [RegExp, string][] = [
  // „заразди" е грешен превод на „unburdened by dignity"; вярното е „задръжки"
  [/заразди/g, 'задръжки'],
  // „холостяк" е руска заемка; стандартната БГ дума е „ерген"
  [/холостяк/g, 'ерген'],
  // Правопис: „Движение карти" → „Карти за движение"
  [/Движение карти/g, 'Карти за движение'],
  // Правопис: „троферий" → „трофей"
  [/троферий/g, 'трофей'],
  // Правопис: „игрта" → „играта"
  [/игрта/g, 'играта'],
]

function замени(текст: string): string {
  let резултат = текст
  for (const [pattern, replacement] of ЗАМЕНИ) {
    резултат = резултат.replace(pattern, replacement)
  }
  return резултат
}

async function main() {
  const игра = await prisma.game.findFirst({
    where: { slug: 'gay-dating-game' },
    select: { id: true, titleEn: true, descriptionBg: true },
  })

  if (!игра || !игра.descriptionBg) {
    console.log('❌ Играта не е намерена или няма BG описание.')
    return
  }

  const ново = замени(игра.descriptionBg)

  if (ново === игра.descriptionBg) {
    console.log('ℹ️  Няма промени — текстовете не са намерени.')
    return
  }

  console.log(`\n=== ${игра.titleEn} ===\n`)
  console.log('--- ПРЕДИ ---\n' + игра.descriptionBg)
  console.log('\n--- СЛЕД ---\n' + ново)

  await prisma.game.update({
    where: { id: игра.id },
    data:  { descriptionBg: ново },
  })

  console.log('\n✅ Описанието е обновено.')
}

main()
  .catch((err) => { console.error('Грешка:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
