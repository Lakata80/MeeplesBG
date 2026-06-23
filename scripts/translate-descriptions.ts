/**
 * Скрипт за автоматичен превод на описания на игри (EN → BG) чрез Claude API
 * Употреба: npm run translate
 *
 * Изисква ANTHROPIC_API_KEY в .env
 * Прескача игри с вече попълнен descriptionBg.
 * При прекъсване може да се стартира отново — resume е автоматичен.
 */

import Anthropic         from '@anthropic-ai/sdk'
import { PrismaClient }  from '@prisma/client'
import * as fs           from 'fs'
import * as path         from 'path'

// ──────────────────────────────────────────────
// Конфигурация
// ──────────────────────────────────────────────

const МОДЕЛ        = 'claude-haiku-4-5-20251001'
const МАКС_ТОКЕНИ  = 4096
const ЗАКЪСНЕНИЕ   = 400  // ms между извикванията
const LOG_DIR      = path.join(process.cwd(), 'logs')
const LOG_FILE     = path.join(LOG_DIR, 'translate-errors.txt')

// ──────────────────────────────────────────────
// System prompt — преводач на настолни игри
// ──────────────────────────────────────────────

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

function прогрес(текущ: number, общо: number, заглавие: string) {
  const процент   = Math.round((текущ / общо) * 100)
  const дължина   = 30
  const запълнени = Math.round((текущ / общо) * дължина)
  const лента     = '█'.repeat(запълнени) + '░'.repeat(дължина - запълнени)
  process.stdout.write(`\r[${лента}] ${процент}% (${текущ}/${общо}) ${заглавие.slice(0, 40).padEnd(40)}`)
}

function логГрешка(бггId: number | null, заглавие: string, грешка: string) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
  const ред = `[${new Date().toISOString()}] bggId=${бггId} "${заглавие}" — ${грешка}\n`
  fs.appendFileSync(LOG_FILE, ред)
}

function закъснение(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ──────────────────────────────────────────────
// Превод на едно описание
// ──────────────────────────────────────────────

async function преведи(client: Anthropic, текст: string): Promise<string> {
  const отговор = await client.messages.create({
    model:      МОДЕЛ,
    max_tokens: МАКС_ТОКЕНИ,
    system:     SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: текст },
    ],
  })

  const блок = отговор.content[0]
  if (блок.type !== 'text') throw new Error('Неочакван тип отговор от Claude')
  return блок.text.trim()
}

// ──────────────────────────────────────────────
// Главна функция
// ──────────────────────────────────────────────

async function main() {
  const ключ = process.env.ANTHROPIC_API_KEY
  if (!ключ) {
    console.error('❌  Липсва ANTHROPIC_API_KEY в .env')
    process.exit(1)
  }

  const anthropic = new Anthropic({ apiKey: ключ })
  const prisma    = new PrismaClient()

  try {
    const игри = await prisma.game.findMany({
      where: {
        AND: [
          { descriptionEn: { not: null } },
          { descriptionEn: { not: '' } },
          { OR: [{ descriptionBg: null }, { descriptionBg: '' }] },
        ],
      },
      select: {
        id:            true,
        bggId:         true,
        titleEn:       true,
        titleBg:       true,
        descriptionEn: true,
      },
      orderBy: { bggRating: 'desc' },
    })

    if (игри.length === 0) {
      console.log('✓ Всички игри вече имат превод на описанието.')
      return
    }

    console.log(`\n🎲  Намерени ${игри.length} игри за превод (модел: ${МОДЕЛ})\n`)

    let успешни = 0
    let грешки  = 0

    for (let i = 0; i < игри.length; i++) {
      const игра     = игри[i]
      const заглавие = игра.titleBg || игра.titleEn || `bggId=${игра.bggId}`

      прогрес(i + 1, игри.length, заглавие)

      try {
        const превод = await преведи(anthropic, игра.descriptionEn!)

        await prisma.game.update({
          where: { id: игра.id },
          data:  { descriptionBg: превод },
        })

        успешни++
      } catch (грешка) {
        грешки++
        логГрешка(игра.bggId, заглавие, String(грешка))
      }

      if (i < игри.length - 1) await закъснение(ЗАКЪСНЕНИЕ)
    }

    console.log(`\n\n✓ Готово! Преведени: ${успешни} | Грешки: ${грешки}`)
    if (грешки > 0) console.log(`  Грешките са записани в: ${LOG_FILE}`)
    console.log(`\n  Следваща стъпка: npm run import:reindex\n`)

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('\n❌  Неочаквана грешка:', err)
  process.exit(1)
})
