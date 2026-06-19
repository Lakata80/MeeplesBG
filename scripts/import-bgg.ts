/**
 * Скрипт за масов импорт на топ игри от BGG
 * Употреба: npm run import:bgg
 *
 * Извлича ID-та от официалния BGG data dump (ZIP/CSV),
 * след което зарежда детайлите чрез XML API.
 */

import { PrismaClient } from '@prisma/client'
import AdmZip from 'adm-zip'
import * as fs from 'fs'
import * as path from 'path'
import { fetchBGGHotness, fetchGamesByIds } from '../lib/bgg/client'
import type { BggGameDetails } from '../lib/bgg/types'

// ──────────────────────────────────────────────
// Конфигурация
// ──────────────────────────────────────────────
const БРОЙ_ИГРИ    = 2000
const BGG_DUMP_URL = 'https://boardgamegeek.com/data_dumps/bg_ranks'
const BGG_UA       = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const LOG_DIR      = path.join(process.cwd(), 'logs')
const LOG_FILE     = path.join(LOG_DIR, 'import-errors.txt')

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
  const процент  = Math.round((текущ / общо) * 100)
  const дължина  = 32
  const запълнени = Math.round((текущ / общо) * дължина)
  const лента    = '█'.repeat(запълнени) + '░'.repeat(дължина - запълнени)
  const кратко   = заглавие.slice(0, 28).padEnd(28)
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

// ──────────────────────────────────────────────
// Парсира един CSV ред (поддържа кавичени полета)
// ──────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current   = ''
  let inQuotes  = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

// ──────────────────────────────────────────────
// Изтегля BGG data dump и връща топ ID-та
// ──────────────────────────────────────────────
async function изтеглиТопID(брой: number): Promise<number[]> {
  process.stdout.write('  ⟳ Изтеглям BGG data dump (ZIP/CSV)...')

  const res = await fetch(BGG_DUMP_URL, {
    headers: {
      'User-Agent':      BGG_UA,
      'Accept':          'application/zip,application/octet-stream,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer':         'https://boardgamegeek.com/',
    },
    redirect: 'follow',
  })

  if (!res.ok) throw new Error(`BGG data dump HTTP ${res.status}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const zip    = new AdmZip(buffer)
  const entry  = zip.getEntries().find((e) => e.entryName.endsWith('.csv'))
  if (!entry) throw new Error('CSV не е намерен в ZIP архива')

  const csv   = entry.getData().toString('utf8')
  const lines = csv.split('\n')

  // Прочети заглавния ред за да намерим колоните по име
  const headers     = parseCSVLine(lines[0])
  const idIdx       = headers.indexOf('id')
  const rankIdx     = headers.indexOf('rank')
  const isExpIdx    = headers.indexOf('is_expansion')

  if (idIdx === -1 || rankIdx === -1) {
    throw new Error(`Непознат CSV формат. Заглавия: ${lines[0]}`)
  }

  const games: { id: number; rank: number }[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols       = parseCSVLine(line)
    const id         = parseInt(cols[idIdx]  ?? '')
    const rank       = parseInt(cols[rankIdx] ?? '')
    const isExpansion = cols[isExpIdx] === '1'

    if (!id || !rank || isExpansion) continue
    games.push({ id, rank })
  }

  process.stdout.write(` ${games.length} класирани игри\n`)

  return games
    .sort((a, b) => a.rank - b.rank)
    .slice(0, брой)
    .map((g) => g.id)
}

// ──────────────────────────────────────────────
// Записва една игра в базата
// ──────────────────────────────────────────────
async function запишиИгра(игра: BggGameDetails): Promise<'успешно' | 'пропусната' | 'грешка'> {
  try {
    const съществуваща = await prisma.game.findUnique({
      where:  { bggId: игра.id },
      select: { id: true },
    })
    if (съществуваща) return 'пропусната'
    if (игра.isExpansion) return 'пропусната'

    const slug = await намериУникаленСлъг(игра.titleEn, игра.id)

    await prisma.game.create({
      data: {
        bggId:         игра.id,
        slug,
        titleBg:       игра.titleEn,           // временно; ще се превежда
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
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL не е зададен в .env файла!')
    process.exit(1)
  }

  fs.mkdirSync(LOG_DIR, { recursive: true })
  fs.writeFileSync(LOG_FILE, `=== BGG Импорт ${new Date().toISOString()} ===\n`, 'utf8')

  console.log('🎲 MeeplesBG — BGG Импорт на топ 2000 игри')
  console.log('═'.repeat(60))

  // ── Стъпка 1: Събери ID-та ──────────────────
  console.log('\n📋 Стъпка 1: Извличане на ID-та...\n')

  const idSet = new Set<number>()

  // Hotness (50 игри — за да са сигурно в топа)
  try {
    process.stdout.write('  ⟳ BGG Hotness списък...')
    const горещи = await fetchBGGHotness()
    горещи.forEach((г) => idSet.add(г.id))
    process.stdout.write(` добавени ${горещи.length} ID-та\n`)
  } catch (г) {
    process.stdout.write(` ⚠ Пропуснато: ${г}\n`)
  }

  // BGG data dump — официален CSV с всички класирани игри
  try {
    const топId = await изтеглиТопID(БРОЙ_ИГРИ)
    топId.forEach((id) => idSet.add(id))
  } catch (г) {
    console.error(`\n❌ Data dump грешка: ${г}`)
    console.error('   Провери https://boardgamegeek.com/data_dumps/bg_ranks')
    process.exit(1)
  }

  const allIds = [...idSet].slice(0, БРОЙ_ИГРИ)
  console.log(`\n✅ Събрани ${allIds.length} уникални ID-та\n`)

  // ── Стъпка 2: Зареди детайли батчове ────────
  console.log('📦 Стъпка 2: Зареждане на детайли от BGG XML API...\n')

  const BATCH = 200
  const всичкиИгри: BggGameDetails[] = []

  for (let i = 0; i < allIds.length; i += BATCH) {
    const батч      = allIds.slice(i, i + BATCH)
    const номБатч   = Math.floor(i / BATCH) + 1
    const общоБатч  = Math.ceil(allIds.length / BATCH)
    process.stdout.write(`  ⟳ Батч ${номБатч}/${общоБатч} (${батч.length} игри)...`)
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

  let успешно    = 0
  let пропуснати = 0
  let грешки     = 0

  for (let i = 0; i < всичкиИгри.length; i++) {
    const игра = всичкиИгри[i]
    прогрес(i + 1, всичкиИгри.length, игра.titleEn)

    const резултат = await запишиИгра(игра)
    if (резултат === 'успешно')      успешно++
    else if (резултат === 'пропусната') пропуснати++
    else                              грешки++
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
