/**
 * Поправя Latin→Cyrillic хомогрифни замени в descriptionBg.
 * "Безопасно" = думата ИЗЦЯЛО кирилска след замяна само на: a→а, e→е, o→о (+ главни).
 * Думи с останали латински букви се ПРОПУСКАТ и се изписват отделно за ръчен преглед.
 *
 * DRY RUN (по подразбиране): показва промените, без да пише в БД.
 * С --apply: записва промените в БД.
 *
 * Употреба:
 *   npx tsx --env-file=.env scripts/fix-homoglyphs.ts           # dry run
 *   npx tsx --env-file=.env scripts/fix-homoglyphs.ts --apply   # прилага
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

// Latin → Cyrillic хомогрифи (визуално идентични символи с различен Unicode code point)
// Ключовете са ASCII (Latin), стойностите са Cyrillic.
const HMAP: Record<string, string> = {
  a: 'а', // a (U+0061) → а (U+0430)
  e: 'е', // e (U+0065) → е (U+0435)
  o: 'о', // o (U+006F) → о (U+043E)
  A: 'А', // A (U+0041) → А (U+0410)
  E: 'Е', // E (U+0045) → Е (U+0415)
  O: 'О', // O (U+004F) → О (U+041E)
}

const TOKEN_RE = /[a-zA-ZЀ-ӿ]+/g
const HAS_LATIN = /[a-zA-Z]/
const HAS_CYRIL = /[Ѐ-ӿ]/

/** Опитва да поправи думата само чрез хомогрифни замени.
 *  Връща поправения вариант, ако думата е изцяло кирилска след замяна.
 *  Иначе връща null (не е безопасно за автоматична поправка). */
function tryFix(word: string): string | null {
  if (!HAS_LATIN.test(word) || !HAS_CYRIL.test(word)) return null // не е смесена

  let fixed = ''
  for (const ch of word) {
    fixed += HMAP[ch] ?? ch
  }

  if (HAS_LATIN.test(fixed)) return null // все още има латиница → не е безопасно
  return fixed
}

function context(text: string, idx: number, len: number, pad = 35): string {
  const s = Math.max(0, idx - pad)
  const e = Math.min(text.length, idx + len + pad)
  return (s > 0 ? '…' : '') + text.slice(s, e).replace(/\n/g, ' ') + (e < text.length ? '…' : '')
}

async function main() {
  const игри = await prisma.game.findMany({
    select: { id: true, slug: true, titleEn: true, titleBg: true, descriptionBg: true },
    orderBy: { titleEn: 'asc' },
  })

  console.log(APPLY
    ? '🔧 РЕЖИМ ЗАПИС — промените ще бъдат записани в БД\n'
    : '🔍 DRY RUN — само преглед, без промени в БД (добавете --apply за запис)\n',
  )

  let fixedGames = 0
  let fixedWords = 0
  let skippedWords = 0

  for (const игра of игри) {
    if (!игра.descriptionBg) continue

    const text = игра.descriptionBg
    const fixes: { orig: string; fixed: string; ctx: string }[] = []
    const skips: { word: string; ctx: string }[] = []

    // Намираме всички смесени думи
    TOKEN_RE.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = TOKEN_RE.exec(text)) !== null) {
      const word = m[0]
      if (!HAS_LATIN.test(word) || !HAS_CYRIL.test(word)) continue

      const fixed = tryFix(word)
      if (fixed) {
        fixes.push({ orig: word, fixed, ctx: context(text, m.index, word.length) })
      } else {
        skips.push({ word, ctx: context(text, m.index, word.length) })
      }
    }

    if (fixes.length === 0 && skips.length === 0) continue

    const title = игра.titleBg || игра.titleEn || игра.slug
    console.log(`\n[${игра.slug}] ${title}`)

    if (fixes.length > 0) {
      console.log('  ✅ Автоматично поправими:')
      for (const { orig, fixed, ctx } of fixes) {
        console.log(`     "${orig}" → "${fixed}"   (…${ctx}…)`)
        fixedWords++
      }
    }
    if (skips.length > 0) {
      console.log('  ⚠️  Нуждаят се от ръчен преглед:')
      for (const { word, ctx } of skips) {
        console.log(`     "${word}"   (…${ctx}…)`)
        skippedWords++
      }
    }

    if (APPLY && fixes.length > 0) {
      // Прилагаме само автоматично поправимите думи
      let newText = text
      // Заместваме отзад напред по позиция, за да не изместим индексите
      TOKEN_RE.lastIndex = 0
      const replacements: { idx: number; len: number; fixed: string }[] = []
      while ((m = TOKEN_RE.exec(text)) !== null) {
        const f = tryFix(m[0])
        if (f) replacements.push({ idx: m.index, len: m[0].length, fixed: f })
      }
      // Прилагаме отзад напред
      for (const r of replacements.reverse()) {
        newText = newText.slice(0, r.idx) + r.fixed + newText.slice(r.idx + r.len)
      }
      await prisma.game.update({ where: { id: игра.id }, data: { descriptionBg: newText } })
      fixedGames++
    } else if (fixes.length > 0) {
      fixedGames++
    }
  }

  console.log('\n' + '─'.repeat(60))
  if (APPLY) {
    console.log(`✅ Обновени: ${fixedGames} игри, ${fixedWords} думи`)
  } else {
    console.log(`📋 Ще бъдат поправени: ${fixedWords} думи в ${fixedGames} игри`)
  }
  console.log(`⚠️  За ръчен преглед: ${skippedWords} думи`)
  console.log(APPLY ? '' : '\nЗапусни с --apply за да приложиш промените.')
}

main()
  .catch((err) => { console.error('Грешка:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
