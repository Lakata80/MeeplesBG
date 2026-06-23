/**
 * Скрипт за попълване на таблицата Mechanic с EN и BG описания
 * Употреба: npm run import:mechanics
 *
 * Изисква ANTHROPIC_API_KEY в .env
 * Resumable — прескача механики с вече попълнено descriptionEn.
 */

import Anthropic        from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import * as fs          from 'fs'
import * as path        from 'path'

// ──────────────────────────────────────────────
// Конфигурация
// ──────────────────────────────────────────────

const МОДЕЛ       = 'claude-haiku-4-5-20251001'
const ЗАКЪСНЕНИЕ  = 300   // ms между извикванията
const LOG_DIR     = path.join(process.cwd(), 'logs')
const LOG_FILE    = path.join(LOG_DIR, 'mechanics-errors.txt')

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[/,]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function логГрешка(name: string, грешка: string) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
  const ред = `[${new Date().toISOString()}] "${name}" — ${грешка}\n`
  fs.appendFileSync(LOG_FILE, ред)
}

function закъснение(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function прогрес(текущ: number, общо: number, name: string) {
  const процент   = Math.round((текущ / общо) * 100)
  const дължина   = 32
  const запълнени = Math.round((текущ / общо) * дължина)
  const лента     = '█'.repeat(запълнени) + '░'.repeat(дължина - запълнени)
  process.stdout.write(`\r[${лента}] ${String(текущ).padStart(3)}/${общо} (${String(процент).padStart(3)}%) ${name.slice(0, 35).padEnd(35)}`)
}

// ──────────────────────────────────────────────
// Генерира EN описание за дадена механика
// ──────────────────────────────────────────────

async function генерирайEN(клиент: Anthropic, механика: string): Promise<string> {
  const response = await клиент.messages.create({
    model:      МОДЕЛ,
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Write a concise 2-3 sentence description of the board game mechanic "${механика}" in English.
Explain what it means, how it works in practice, and what kind of gameplay experience it creates.
Write in a clear, informative style suitable for a board game database (similar to BoardGameGeek).
Return ONLY the description text, no title, no quotes, no extra formatting.`,
    }],
  })

  const текст = response.content[0]
  if (текст.type !== 'text') throw new Error('Unexpected response type')
  return текст.text.trim()
}

// ──────────────────────────────────────────────
// Превежда EN описание на BG
// ──────────────────────────────────────────────

async function преведиBG(клиент: Anthropic, механика: string, enDesc: string): Promise<string> {
  const response = await клиент.messages.create({
    model:      МОДЕЛ,
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Преведи следното описание на механиката "${механика}" от английски на естествен, ясен български.
Пиши в стила на настолно-игрови речник — кратко, точно, разбираемо.
Запази смисъла, не превеждай буквално.
Върни САМО преведения текст, без заглавие, без кавички, без допълнително форматиране.

Оригинал:
${enDesc}`,
    }],
  })

  const текст = response.content[0]
  if (текст.type !== 'text') throw new Error('Unexpected response type')
  return текст.text.trim()
}

// ──────────────────────────────────────────────
// Главна функция
// ──────────────────────────────────────────────

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('❌ Липсва ANTHROPIC_API_KEY в .env')
    process.exit(1)
  }

  const клиент = new Anthropic({ apiKey })
  const prisma  = new PrismaClient()

  try {
    // 1. Вземи всички уникални механики от игрите
    console.log('🔍 Събиране на уникални механики...')
    const игри = await prisma.game.findMany({
      where:  { isActive: true },
      select: { mechanics: true },
    })
    const всичкиИмена = [...new Set(игри.flatMap((г) => г.mechanics))].sort()
    console.log(`   Намерени ${всичкиИмена.length} уникални механики\n`)

    // 2. Upsert записи без описание (ако не съществуват)
    for (const name of всичкиИмена) {
      await prisma.mechanic.upsert({
        where:  { name },
        create: { name, slug: slugify(name) },
        update: {},
      })
    }

    // 3. Вземи само тези без EN описание (resume поддръжка)
    const заОбработка = await prisma.mechanic.findMany({
      where:   { descriptionEn: null },
      orderBy: { name: 'asc' },
    })

    if (заОбработка.length === 0) {
      console.log('✅ Всички механики вече имат описания!')
      return
    }

    console.log(`📝 Генериране на описания за ${заОбработка.length} механики...\n`)

    let успешни = 0
    let грешки  = 0

    for (let i = 0; i < заОбработка.length; i++) {
      const механика = заОбработка[i]
      прогрес(i + 1, заОбработка.length, механика.name)

      try {
        const descriptionEn = await генерирайEN(клиент, механика.name)
        await закъснение(ЗАКЪСНЕНИЕ)

        const descriptionBg = await преведиBG(клиент, механика.name, descriptionEn)
        await закъснение(ЗАКЪСНЕНИЕ)

        await prisma.mechanic.update({
          where: { id: механика.id },
          data:  { descriptionEn, descriptionBg },
        })

        успешни++
      } catch (грешка) {
        грешки++
        логГрешка(механика.name, String(грешка))
      }
    }

    console.log(`\n\n✅ Готово!`)
    console.log(`   Обработени: ${успешни}`)
    if (грешки > 0) console.log(`   Грешки:     ${грешки} (вж. ${LOG_FILE})`)

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('\n❌ Неочаквана грешка:', err)
  process.exit(1)
})
