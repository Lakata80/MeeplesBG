/**
 * Замества „Началник/Началника/Началниците..." с „Бос/Боса/Босовете..."
 * в полето descriptionBg на всички игри.
 * Употреба: npx tsx --env-file=.env scripts/fix-boss-translations.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Двойки за замяна — по-дългите форми първи, за да не се засече с по-краткото "Началник"
const ЗАМЕНИ: [RegExp, string][] = [
  [/Началниците/g,   'Босовете'],
  [/началниците/g,   'босовете'],
  [/Началниците/g,   'Босовете'],  // на всеки случай
  [/Началници/g,    'Босове'],
  [/началници/g,    'босове'],
  [/Началникът/g,   'Босът'],
  [/началникът/g,   'босът'],
  [/Началника/g,    'Боса'],
  [/началника/g,    'боса'],
  [/Началник/g,     'Бос'],
  [/началник/g,     'бос'],
]

function замени(текст: string): string {
  let резултат = текст
  for (const [pattern, replacement] of ЗАМЕНИ) {
    резултат = резултат.replace(pattern, replacement)
  }
  return резултат
}

async function main() {
  const игри = await prisma.game.findMany({
    where: { descriptionBg: { contains: 'началник', mode: 'insensitive' } },
    select: { id: true, titleBg: true, titleEn: true, descriptionBg: true },
  })

  console.log(`Намерени ${игри.length} игри с „Началник" в описанието.\n`)

  let обновени = 0
  for (const игра of игри) {
    if (!игра.descriptionBg) continue
    const новоОписание = замени(игра.descriptionBg)
    if (новоОписание === игра.descriptionBg) continue

    await prisma.game.update({
      where: { id: игра.id },
      data:  { descriptionBg: новоОписание },
    })

    console.log(`✓ ${игра.titleBg || игра.titleEn}`)
    обновени++
  }

  console.log(`\nГотово! Обновени: ${обновени} игри.`)
}

main()
  .catch((err) => { console.error('Грешка:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
