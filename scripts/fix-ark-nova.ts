/**
 * Поправя грешки в превода на описанието на „Ark Nova".
 * Употреба: npx tsx --env-file=.env scripts/fix-ark-nova.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ЗАМЕНИ: [RegExp, string][] = [
  // Грешен граматически род: „зоопарк" е мъжки род
  [/модерна, научно управлявана зоопарк/g, 'модерен, научно управляван зоопарк'],
  // „огради, разместващи животни" не е естествен БГ; EN: „build enclosures, accommodate animals"
  [/ще строите огради, разместващи животни/g, 'ще строите заграждения и ще настанявате животни в тях'],
  // „точки за запазване" е неточен термин за „conservation points" (втория вид точки в играта)
  [/ и за да събирате точки за запазване\./g, ', както и да събирате точки от консервиране на животни.'],
  // Почистване на евентуален останал интервал пред запетая
  [/си , както/g, 'си, както'],
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
    where: { slug: 'ark-nova' },
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
