/**
 * Синхронизира BGG Hotness топ 50 с базата данни.
 * Пускай веднъж на 1-2 седмици: npm run hotness:sync
 *
 * Стъпки:
 *  1. Взима текущия BGG Hotness списък
 *  2. Проверява кои от топ 50 липсват в базата
 *  3. За всяка липсваща: импорт от BGG → превод → индексиране
 */

import Anthropic        from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import { fetchBGGHotness, fetchGamesByIds } from '../lib/bgg/client'
import { indexGame }                        from '../lib/search/indexing'
import type { BggGameDetails }              from '../lib/bgg/types'

const МОДЕЛ       = 'claude-haiku-4-5-20251001'
const МАКС_ТОКЕНИ = 4096

const SYSTEM_PROMPT = `Ти си професионален преводач и редактор на настолни игри (board games), специализиран в превод от английски на български.

Твоята задача е да превеждаш описания, правила, инструкции и текстове за настолни игри от английски на български по начин, подходящ за публикуване.

Основни изисквания:

1. Преводът НЕ трябва да бъде буквален.
Превеждай смисъла и използвай естествен български език, както би го написал професионален издател на настолни игри.

2. Запази структурата на текста, заглавията, списъците, удебеляването, имената на карти и специални термини, числови стойности и символи.

3. Стил: ясен, кратък, точен, без излишни обяснения, лесен за разбиране от играчи.

4. Терминология: game = игра, player = играч, turn = ход, round = рунд, card = карта, deck = тесте, score = точки, victory points = победни точки, token = жетон, tile = плочка/тайл, meeple = мийпъл, resource = ресурс, expansion = разширение.

5. Не превеждай имена на игри, собствени имена или уникални карти/герои/фракции.

6. Дай само готовия превод без обяснения.`

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function findUniqueSlug(prisma: PrismaClient, title: string, bggId: number): Promise<string> {
  const base  = slugify(title) || `game-${bggId}`
  const taken = await prisma.game.findUnique({ where: { slug: base }, select: { bggId: true } })
  if (!taken || taken.bggId === bggId) return base
  return `${base}-${bggId}`
}

function separator() { console.log('─'.repeat(60)) }

async function main() {
  if (!process.env.DATABASE_URL)      { console.error('❌ Липсва DATABASE_URL');      process.exit(1) }
  if (!process.env.ANTHROPIC_API_KEY) { console.error('❌ Липсва ANTHROPIC_API_KEY'); process.exit(1) }

  const prisma    = new PrismaClient()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  console.log('\n🔥 MeeplesBG — Hotness Sync')
  console.log(`   ${new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}`)
  separator()

  try {
    // ── Стъпка 1: Вземи hotness списъка ──────────
    console.log('\n📡 Стъпка 1/3: Извличане на BGG Hotness топ 50...')
    const горещи = await fetchBGGHotness()
    console.log(`   Получени ${горещи.length} игри\n`)

    // ── Стъпка 2: Провери кои липсват ────────────
    const bggIds  = горещи.map((г) => г.id)
    const вБазата = await prisma.game.findMany({
      where:  { bggId: { in: bggIds } },
      select: { bggId: true, slug: true },
    })
    const намерени  = new Set(вБазата.map((г) => г.bggId))
    const липсващи = горещи.filter((г) => !намерени.has(г.id))

    console.log(`   ✅ В базата: ${намерени.size} / ${горещи.length}`)

    if (липсващи.length === 0) {
      console.log('   🎉 Всички игри от топ 50 са в базата — нищо за импортиране!')
      separator()
      return
    }

    console.log(`   ❌ Липсват: ${липсващи.length} игри`)
    for (const г of липсващи) {
      console.log(`      • "${г.name}" (BGG ${г.id})`)
    }

    // ── Стъпка 3: Импортирай липсващите ──────────
    console.log(`\n📦 Стъпка 2/3: Импорт от BGG...`)
    const детайли = await fetchGamesByIds(липсващи.map((г) => г.id))

    const импортирани: BggGameDetails[] = []

    for (const игра of детайли) {
      if (игра.isExpansion) {
        console.log(`   ⏭  "${игра.titleEn}" — разширение, пропусната`)
        continue
      }
      const exists = await prisma.game.findUnique({ where: { bggId: игра.id }, select: { id: true } })
      if (exists) {
        console.log(`   ⏭  "${игра.titleEn}" — вече съществува`)
        continue
      }

      const slug = await findUniqueSlug(prisma, игра.titleEn, игра.id)
      await prisma.game.create({
        data: {
          bggId:         игра.id,
          slug,
          titleBg:       игра.titleEn,
          titleEn:       игра.titleEn,
          descriptionBg: '',
          descriptionEn: игра.descriptionEn.slice(0, 10_000),
          yearPublished: игра.yearPublished,
          minPlayers:    игра.minPlayers,
          maxPlayers:    игра.maxPlayers,
          minPlaytime:   игра.minPlaytime,
          maxPlaytime:   игра.maxPlaytime,
          minAge:        игра.minAge,
          weight:        игра.weight,
          bggRating:     игра.bggRating,
          imageUrl:      игра.imageUrl,
          thumbnailUrl:  игра.thumbnailUrl,
          categories:    игра.categories,
          mechanics:     игра.mechanics,
          types:         игра.types,
          isActive:      true,
        },
      })
      импортирани.push(игра)
      console.log(`   ✅ "${игра.titleEn}" → /igri/${slug}`)
    }

    if (импортирани.length === 0) {
      console.log('   Няма нови игри за обработка.')
      separator()
      return
    }

    // ── Стъпка 4: Превод ─────────────────────────
    console.log(`\n🌐 Стъпка 3/3: Превод и индексиране...`)

    for (const игра of импортирани) {
      process.stdout.write(`   ⟳  "${игра.titleEn}"... `)

      // Превод
      if (игра.descriptionEn) {
        try {
          const отговор = await anthropic.messages.create({
            model:      МОДЕЛ,
            max_tokens: МАКС_ТОКЕНИ,
            system:     SYSTEM_PROMPT,
            messages:   [{ role: 'user', content: игра.descriptionEn }],
          })
          const блок = отговор.content[0]
          if (блок.type === 'text') {
            await prisma.game.update({
              where: { bggId: игра.id },
              data:  { descriptionBg: блок.text.trim() },
            })
          }
        } catch {
          process.stdout.write('(превод пропуснат) ')
        }
      }

      // Индексиране
      const записана = await prisma.game.findUnique({ where: { bggId: игра.id } })
      if (записана) await indexGame(записана)

      console.log('✅')
    }

    // ── Обобщение ─────────────────────────────────
    separator()
    console.log(`\n🎉 Sync завършен!`)
    console.log(`   Добавени игри: ${импортирани.length}`)
    console.log(`   Общо в топ 50: ${намерени.size + импортирани.length} / ${горещи.length}`)
    if (горещи.length - намерени.size - импортирани.length > 0) {
      console.log(`   Пропуснати (разширения): ${горещи.length - намерени.size - импортирани.length}`)
    }
    console.log()

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((г) => { console.error('\n❌ Грешка:', г); process.exit(1) })
