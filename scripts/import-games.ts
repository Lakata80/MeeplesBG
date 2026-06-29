/**
 * Импортира конкретни игри от BGG по техните ID-та.
 * Изпълнява всичките 3 стъпки: запис в DB → превод → индексиране.
 *
 * Употреба:
 *   npm run import:games -- 473061 451772
 *   npm run import:games -- 174430
 */

import Anthropic        from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import { fetchGamesByIds }            from '../lib/bgg/client'
import { indexGame }                  from '../lib/search/indexing'
import type { BggGameDetails }        from '../lib/bgg/types'

// ──────────────────────────────────────────────
// Аргументи
// ──────────────────────────────────────────────

const args   = process.argv.slice(2)
const bggIds = args.map(Number).filter((n) => n > 0)

if (bggIds.length === 0) {
  console.error('❌ Подай поне един BGG ID като аргумент.')
  console.error('   Пример: npm run import:games -- 473061 451772')
  process.exit(1)
}

// ──────────────────────────────────────────────
// Конфигурация
// ──────────────────────────────────────────────

const МОДЕЛ       = 'claude-haiku-4-5-20251001'
const МАКС_ТОКЕНИ = 4096

const SYSTEM_PROMPT = `Ти си професионален преводач и редактор на настолни игри (board games), специализиран в превод от английски на български.

Твоята задача е да превеждаш описания, правила, инструкции и текстове за настолни игри от английски на български по начин, подходящ за публикуване.

Основни изисквания:

1. Преводът НЕ трябва да бъде буквален.
Превеждай смисъла и използвай естествен български език, както би го написал професионален издател на настолни игри.

2. Запази:
- структурата на текста;
- заглавията;
- списъци;
- удебеляване/форматиране;
- имена на карти, фази, компоненти и специални термини;
- числови стойности и символи.

3. Стил:
Използвай стил на официален правилник за настолна игра:
- ясен;
- кратък;
- точен;
- без излишни обяснения;
- лесен за разбиране от играчи.

4. Терминология:
Поддържай еднакъв превод на термините.

game = игра
board game = настолна игра
player = играч
turn = ход
round = рунд
phase = фаза
setup = подготовка
rule = правило
action = действие
ability = умение/способност (според контекста)
card = карта
deck = тесте
draw a card = изтеглете карта
discard = изхвърлете/отхвърлете
score = точки/точкуване
victory points = победни точки
goal = цел
objective = задача/цел
token = жетон
tile = плочка/тайл (според контекста)
meeple = мийпъл
resource = ресурс
upgrade = подобрение
player mat = табло на играча
expansion = разширение

5. Имена:
- Не превеждай имена на игри.
- Не превеждай собствени имена.
- Не променяй названия на уникални карти, герои или фракции, освен ако няма официален превод.

6. Формат на отговора:
Дай само готовия превод.
Не добавяй обяснения преди или след текста, освен ако не откриеш терминологичен проблем (в такъв случай добави "Бележка за редактор: ..." в края).`

// ──────────────────────────────────────────────
// Помощни функции
// ──────────────────────────────────────────────

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

function separator() {
  console.log('─'.repeat(56))
}

// ──────────────────────────────────────────────
// Стъпка 1: Запис в PostgreSQL
// ──────────────────────────────────────────────

async function importGame(
  prisma: PrismaClient,
  игра: BggGameDetails
): Promise<'imported' | 'skipped' | 'expansion'> {
  if (игра.isExpansion) return 'expansion'

  const existing = await prisma.game.findUnique({ where: { bggId: игра.id }, select: { id: true } })
  if (existing) return 'skipped'

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

  return 'imported'
}

// ──────────────────────────────────────────────
// Стъпка 2: Превод на описание
// ──────────────────────────────────────────────

async function translateDescription(
  anthropic: Anthropic,
  prisma: PrismaClient,
  bggId: number
): Promise<'translated' | 'skipped' | 'no_description'> {
  const игра = await prisma.game.findUnique({
    where:  { bggId },
    select: { id: true, descriptionEn: true, descriptionBg: true },
  })
  if (!игра) return 'skipped'
  if (!игра.descriptionEn) return 'no_description'
  if (игра.descriptionBg)  return 'skipped'

  const отговор = await anthropic.messages.create({
    model:      МОДЕЛ,
    max_tokens: МАКС_ТОКЕНИ,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: игра.descriptionEn }],
  })

  const блок = отговор.content[0]
  if (блок.type !== 'text') throw new Error('Неочакван тип отговор от Claude')

  await prisma.game.update({
    where: { id: игра.id },
    data:  { descriptionBg: блок.text.trim() },
  })

  return 'translated'
}

// ──────────────────────────────────────────────
// Стъпка 3: Индексиране в MeiliSearch
// ──────────────────────────────────────────────

async function indexInSearch(prisma: PrismaClient, bggId: number): Promise<void> {
  const игра = await prisma.game.findUnique({ where: { bggId } })
  if (!игра) throw new Error(`Играта с BGG ID ${bggId} не е намерена в базата`)
  await indexGame(игра)
}

// ──────────────────────────────────────────────
// Главна функция
// ──────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL не е зададен в .env'); process.exit(1)
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY не е зададен в .env'); process.exit(1)
  }

  const prisma    = new PrismaClient()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  console.log(`\n🎲 MeeplesBG — Импорт на ${bggIds.length} игри`)
  console.log(`   BGG ID-та: ${bggIds.join(', ')}`)
  separator()

  try {
    // ── Стъпка 1: Извличане от BGG ───────────────
    console.log('\n📡 Стъпка 1/3: Извличане от BGG...\n')
    const игри = await fetchGamesByIds(bggIds)
    console.log(`   Получени детайли за ${игри.length} игри\n`)

    for (const игра of игри) {
      const резултат = await importGame(prisma, игра)
      const икона = резултат === 'imported' ? '✅' : резултат === 'skipped' ? '⏭ ' : '⏭ '
      const текст  = резултат === 'imported'  ? 'записана'
                   : резултат === 'skipped'   ? 'вече съществува — пропусната'
                   :                            'разширение — пропуснато'
      console.log(`   ${икона} "${игра.titleEn}" (BGG ${игра.id}) — ${текст}`)
    }

    // ── Стъпка 2: Превод ─────────────────────────
    console.log('\n🌐 Стъпка 2/3: Превод на описания...\n')

    for (const id of bggIds) {
      const игра = игри.find((г) => г.id === id)
      if (!игра) continue

      process.stdout.write(`   ⟳  "${игра.titleEn}"... `)
      const резултат = await translateDescription(anthropic, prisma, id)
      const текст = резултат === 'translated'     ? '✅ преведено'
                  : резултат === 'skipped'         ? '⏭  вече преведено'
                  :                                  '⏭  няма английско описание'
      console.log(текст)
    }

    // ── Стъпка 3: Индексиране ────────────────────
    console.log('\n🔍 Стъпка 3/3: Индексиране в MeiliSearch...\n')

    for (const id of bggIds) {
      const игра = игри.find((г) => г.id === id)
      if (!игра || игра.isExpansion) continue

      await indexInSearch(prisma, id)
      console.log(`   ✅ "${игра.titleEn}" — индексирана`)
    }

    // ── Обобщение ────────────────────────────────
    separator()
    console.log('\n🎉 Готово! Игрите са достъпни на:')
    for (const игра of игри.filter((г) => !г.isExpansion)) {
      const slug = slugify(игра.titleEn)
      console.log(`   → /igri/${slug}`)
    }
    console.log()

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((г) => { console.error('\n❌ Грешка:', г); process.exit(1) })
