/**
 * Поправя грешки в превода на описанието на „Kano".
 * Употреба: npx tsx --env-file=.env scripts/fix-kano.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ЗАМЕНИ: [RegExp, string][] = [
  // „подсчитване" е руска заемка; правилната БГ дума е „броене"
  [/подсчитване на точки/g, 'броене на точки'],
  // Правопис: „держат" → „държат"
  [/держат/g, 'държат'],
  // Правопис: „Игра изящно" → „Играта изящно" (липсва определителен член)
  [/Игра изящно/g, 'Играта изящно'],
  // Правопис: „Игра достига" → „Играта достига"
  [/Игра достига/g, 'Играта достига'],
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
    where: { slug: 'kano' },
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
