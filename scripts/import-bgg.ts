/**
 * Скрипт за масов импорт на топ 2000 игри от BGG
 * Употреба: npm run import:bgg
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fetchBGGHotness, fetchBGGTop, fetchGamesByIds } from '../lib/bgg/client'
import type { BggGameDetails } from '../lib/bgg/types'

// ──────────────────────────────────────────────
// Конфигурация
// ──────────────────────────────────────────────
const БРОЙ_ИГРИ  = 2000
const BROWSE_PAGES = 20          // 20 стр. × ~100 игри = ~2000 ID-та
const LOG_DIR    = path.join(process.cwd(), 'logs')
const LOG_FILE   = path.join(LOG_DIR, 'import-errors.txt')

const prisma = new PrismaClient()

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

function прогрес(текущ: number, общо: number, заглавие: string) {
  const процент = Math.round((текущ / общо) * 100)
  const дължина = 32
  const запълнени = Math.round((текущ / общо) * дължина)
  const лента = '█'.repeat(запълнени) + '░'.repeat(дължина - запълнени)
  const кратко = заглавие.slice(0, 28).padEnd(28)
  process.stdout.write(`\r[${лента}] ${String(текущ).padStart(4)}/${общо} ${кратко} (${String(процент).padStart(3)}%)`)
}

function логГрешка(bggId: number, заглавие: string, грешка: string) {
  const ред = `[${new Date().toISOString()}] ID=${bggId} "${заглавие}" — ${грешка}\n`
  fs.appendFileSync(LOG_FILE, ред, 'utf8')
}

async function намериУникаленСлъг(заглавие: string, bggId: number): Promise<string> {
  const базов = slugify(заглавие) || `game-${bggId}`
  const заето = await prisma.game.findUnique({ where: { slug: базов }, select: { bggId: true } })
  if (!заето || заето.bggId === bggId) return базов
  return `${базов}-${bggId}`
}

async function запишиИгра(игра: BggGameDetails): Promise<'успешно' | 'пропусната' | 'грешка'> {
  try {
    // Пропускаме вече съществуващи игри
    const съществуваща = await prisma.game.findUnique({
      where: { bggId: игра.id },
      select: { id: true },
    })
    if (съществуваща) return 'пропусната'

    // Пропускаме разширения (expansion)
    if (игра.isExpansion) return 'пропусната'

    const slug = await намериУникаленСлъг(игра.titleEn, игра.id)

    await prisma.game.create({
      data: {
        bggId:         игра.id,
        slug,
        titleBg:       '',              // за ръчен превод по-късно
        titleEn:       игра.titleEn,
        descriptionBg: '',
        descriptionEn: игра.descriptionEn.slice(0, 10000), // ограничение
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

    return 'успешно'
  } catch (грешка) {
    логГрешка(игра.id, игра.titleEn, String(грешка))
    return 'грешка'
  }
}

// ──────────────────────────────────────────────
// Главна функция
// ──────────────────────────────────────────────
async function main() {
  // Проверка за DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL не е зададен в .env файла!')
    process.exit(1)
  }

  // Подготви log директорията
  fs.mkdirSync(LOG_DIR, { recursive: true })
  fs.writeFileSync(LOG_FILE, `=== BGG Импорт ${new Date().toISOString()} ===\n`, 'utf8')

  console.log('🎲 MeeplesBG — BGG Импорт на топ 2000 игри')
  console.log('═'.repeat(60))

  // ── Стъпка 1: Събери ID-та ──────────────────
  console.log('\n📋 Стъпка 1: Извличане на ID-та...\n')

  const idSet = new Set<number>()

  // Hotness (50 игри)
  try {
    process.stdout.write('  ⟳ BGG Hotness списък...')
    const горещи = await fetchBGGHotness()
    горещи.forEach((г) => idSet.add(г.id))
    process.stdout.write(` добавени ${горещи.length} ID-та\n`)
  } catch (г) {
    console.warn(`  ⚠ Не успяхме да заредим hotness: ${г}`)
  }

  // Browse страниц (топ по рейтинг)
  for (let стр = 1; стр <= BROWSE_PAGES; стр++) {
    process.stdout.write(`  ⟳ Страница ${String(стр).padStart(2)}/${BROWSE_PAGES}...`)
    try {
      const ид = await fetchBGGTop(стр)
      ид.forEach((i) => idSet.add(i))
      process.stdout.write(` ${ид.length} ID-та (общо ${idSet.size})\n`)
    } catch (г) {
      process.stdout.write(` ⚠ Грешка: ${г}\n`)
    }
  }

  const allIds = [...idSet].slice(0, БРОЙ_ИГРИ)
  console.log(`\n✅ Събрани ${allIds.length} уникални ID-та\n`)

  // ── Стъпка 2: Зареди детайли батчове ────────
  console.log('📦 Стъпка 2: Зареждане на детайли от BGG...\n')

  const BATCH = 200
  const всичкиИгри: BggGameDetails[] = []

  for (let i = 0; i < allIds.length; i += BATCH) {
    const батч = allIds.slice(i, i + BATCH)
    const номБатч = Math.floor(i / BATCH) + 1
    const общоБатчове = Math.ceil(allIds.length / BATCH)
    process.stdout.write(`  ⟳ Батч ${номБатч}/${общоБатчове} (${батч.length} игри)...`)
    try {
      const игри = await fetchGamesByIds(батч)
      всичкиИгри.push(...игри)
      process.stdout.write(` получени ${игри.length}\n`)
    } catch (г) {
      process.stdout.write(` ⚠ Грешка: ${г}\n`)
    }
  }

  console.log(`\n✅ Получени детайли за ${всичкиИгри.length} игри\n`)

  // ── Стъпка 3: Запиши в базата ────────────────
  console.log('💾 Стъпка 3: Запис в базата данни...\n')

  let успешно  = 0
  let пропуснати = 0
  let грешки   = 0

  for (let i = 0; i < всичкиИгри.length; i++) {
    const игра = всичкиИгри[i]
    прогрес(i + 1, всичкиИгри.length, игра.titleEn)

    const резултат = await запишиИгра(игра)
    if (резултат === 'успешно')    успешно++
    else if (резултат === 'пропусната') пропуснати++
    else                            грешки++
  }

  // ── Обобщение ────────────────────────────────
  console.log('\n\n' + '═'.repeat(60))
  console.log('📊 Обобщение:')
  console.log(`   ✅ Успешно импортирани : ${успешно}`)
  console.log(`   ⏭  Пропуснати          : ${пропуснати}`)
  console.log(`   ❌ Грешки              : ${грешки}`)
  console.log(`\n   Лог файл: ${LOG_FILE}`)
  console.log('═'.repeat(60))

  if (грешки > 0) {
    console.log(`\n⚠  Има ${грешки} грешки — виж ${LOG_FILE}`)
  }
}

main()
  .catch((грешка) => {
    console.error('\n❌ Фатална грешка:', грешка)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
