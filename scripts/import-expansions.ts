/**
 * Импортира разширения (expansions) за всички игри в базата данни.
 * Пускай след import:bgg: npm run expansions:import
 *
 * Стъпки:
 *  1. Зарежда всички базови игри (без expansions) от БД
 *  2. Batch-fetch от BGG за всяка игра → взима expansionBggIds
 *  3. За всяко expansion: import, превод, индексиране
 *  4. За expansions вече в БД → update baseGameId ако липсва
 */

import Anthropic        from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import { fetchGamesByIds } from '../lib/bgg/client'
import { indexGame }       from '../lib/search/indexing'

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

  console.log('\n📦 MeeplesBG — Import Expansions')
  console.log(`   ${new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}`)
  separator()

  try {
    // ── Стъпка 1: Зареди базовите игри от БД ─────
    console.log('\n📋 Стъпка 1: Зареждане на базови игри от БД...')
    const базовиИгри = await prisma.game.findMany({
      where:  { bggId: { not: null }, baseGameId: null, isActive: true },
      select: { id: true, bggId: true, titleBg: true },
    })
    console.log(`   Намерени ${базовиИгри.length} базови игри\n`)

    // ── Стъпка 2: Batch-fetch от BGG за expansion IDs ──
    console.log('📡 Стъпка 2: Извличане на expansion ID-та от BGG...')
    const bggIds = базовиИгри.map((г) => г.bggId as number)

    // Batch по 20 ID-та
    const BATCH = 20
    const всичкиExIds = new Map<number, string>() // expansionBggId → baseGameId (Prisma id)
    let обработени = 0

    for (let i = 0; i < bggIds.length; i += BATCH) {
      const пачка    = bggIds.slice(i, i + BATCH)
      const детайли  = await fetchGamesByIds(пачка)

      for (const дет of детайли) {
        const базова = базовиИгри.find((г) => г.bggId === дет.id)
        if (!базова) continue
        for (const exId of дет.expansionBggIds) {
          if (!всичкиExIds.has(exId)) {
            всичкиExIds.set(exId, базова.id)
          }
        }
      }

      обработени += пачка.length
      process.stdout.write(`\r   Обработени: ${обработени} / ${bggIds.length}`)
    }
    console.log(`\n   Намерени ${всичкиExIds.size} уникални expansion ID-та\n`)

    if (всичкиExIds.size === 0) {
      console.log('   🎉 Няма expansion ID-та за импортиране.')
      separator()
      return
    }

    // ── Стъпка 3: Провери кои expansions вече са в БД ──
    console.log('🔍 Стъпка 3: Проверка в базата данни...')
    const exBggIds    = [...всичкиExIds.keys()]
    const вБазата     = await prisma.game.findMany({
      where:  { bggId: { in: exBggIds } },
      select: { id: true, bggId: true, baseGameId: true },
    })
    const вБазатаMap  = new Map(вБазата.map((г) => [г.bggId as number, г]))

    // Expansions в БД без baseGameId → само update
    const заUpdate = вБазата.filter((г) => !г.baseGameId && всичкиExIds.has(г.bggId as number))
    // Expansions, които изобщо не са в БД → import
    const заImport = exBggIds.filter((id) => !вБазатаMap.has(id))

    console.log(`   Вече в БД (с baseGameId): ${вБазата.length - заUpdate.length}`)
    console.log(`   За update (без baseGameId): ${заUpdate.length}`)
    console.log(`   За нов импорт: ${заImport.length}\n`)

    // ── Стъпка 3a: Update на вече съществуващи ──
    if (заUpdate.length > 0) {
      console.log('🔗 Стъпка 3a: Свързване на вече съществуващи разширения...')
      for (const г of заUpdate) {
        const baseId = всичкиExIds.get(г.bggId as number)
        if (baseId) {
          await prisma.game.update({
            where: { id: г.id },
            data:  { baseGameId: baseId },
          })
          process.stdout.write('.')
        }
      }
      console.log(`\n   ✅ ${заUpdate.length} разширения свързани\n`)
    }

    // ── Стъпка 4: Импорт на нови expansions ──────
    if (заImport.length === 0) {
      console.log('🎉 Всички разширения вече са в базата!')
      separator()
      return
    }

    console.log(`📥 Стъпка 4: Импорт на ${заImport.length} нови разширения от BGG...`)
    const импортирани: { id: number; titleEn: string; descriptionEn: string; baseGameId: string }[] = []

    for (let i = 0; i < заImport.length; i += BATCH) {
      const пачка   = заImport.slice(i, i + BATCH)
      const детайли = await fetchGamesByIds(пачка)

      for (const игра of детайли) {
        const baseGameId = всичкиExIds.get(игра.id)
        if (!baseGameId) continue

        const съществува = await prisma.game.findUnique({ where: { bggId: игра.id }, select: { id: true } })
        if (съществува) {
          await prisma.game.update({ where: { id: съществува.id }, data: { baseGameId } })
          console.log(`   🔗 "${игра.titleEn}" — вече в БД, свързано`)
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
            baseGameId,
          },
        })
        импортирани.push({ id: игра.id, titleEn: игра.titleEn, descriptionEn: игра.descriptionEn, baseGameId })
        console.log(`   ✅ "${игра.titleEn}" → /igri/${slug}`)
      }
    }

    // ── Стъпка 5: Превод и индексиране ───────────
    if (импортирани.length === 0) {
      console.log('\n   Няма нови разширения за превод.')
      separator()
      return
    }

    console.log(`\n🌐 Стъпка 5: Превод и индексиране на ${импортирани.length} разширения...`)
    separator()

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

      // Индексиране в MeiliSearch
      const записана = await prisma.game.findUnique({ where: { bggId: игра.id } })
      if (записана) await indexGame(записана)

      console.log('✅')
    }

    // ── Обобщение ─────────────────────────────────
    separator()
    console.log(`\n🎉 Импортът завършен!`)
    console.log(`   Нови разширения:    ${импортирани.length}`)
    console.log(`   Свързани (update):  ${заUpdate.length}`)
    console.log(`   Общо expansion ID:  ${всичкиExIds.size}`)
    console.log()

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((г) => { console.error('\n❌ Грешка:', г); process.exit(1) })
