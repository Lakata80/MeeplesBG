/**
 * Сканира descriptionBg на всички игри за думи с MIXED Latin+Cyrillic символи.
 * Само четене — не прави никакви промени в БД.
 * Употреба: npx tsx --env-file=.env scripts/scan-mixed-scripts.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TOKEN_RE  = /[a-zA-ZЀ-ӿ]+/g
const LATIN_RE  = /[a-zA-Z]/
const CYRIL_RE  = /[Ѐ-ӿ]/

function isMixed(word: string): boolean {
  return LATIN_RE.test(word) && CYRIL_RE.test(word)
}

function context(text: string, index: number, length: number, pad = 40): string {
  const start = Math.max(0, index - pad)
  const end   = Math.min(text.length, index + length + pad)
  const pre   = start > 0 ? '…' : ''
  const post  = end < text.length ? '…' : ''
  return pre + text.slice(start, end).replace(/\n/g, ' ') + post
}

async function main() {
  const игри = await prisma.game.findMany({
    select: { slug: true, titleEn: true, titleBg: true, descriptionBg: true },
    orderBy: { titleEn: 'asc' },
  })

  let намеренИгри = 0
  let намеренДуми = 0

  for (const игра of игри) {
    if (!игра.descriptionBg) continue

    const text  = игра.descriptionBg
    const found: { word: string; ctx: string }[] = []

    let match: RegExpExecArray | null
    TOKEN_RE.lastIndex = 0
    while ((match = TOKEN_RE.exec(text)) !== null) {
      if (isMixed(match[0])) {
        found.push({ word: match[0], ctx: context(text, match.index, match[0].length) })
      }
    }

    if (found.length === 0) continue

    намеренИгри++
    намеренДуми += found.length

    const title = игра.titleBg || игра.titleEn || игра.slug
    console.log(`\n[${игра.slug}] ${title}`)
    for (const { word, ctx } of found) {
      console.log(`  • "${word}"  →  "${ctx}"`)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`Сканирани: ${игри.length} игри | Намерени: ${намеренИгри} игри, ${намеренДуми} думи`)
}

main()
  .catch((err) => { console.error('Грешка:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
