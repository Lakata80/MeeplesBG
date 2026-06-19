/**
 * Скрипт за масов импорт на топ игри от BGG
 * Употреба: npm run import:bgg
 *
 * ID-тата се взимат от BGG data dump (ZIP/gzip/CSV).
 * Ако BGG изисква вход, добави в .env:
 *   BGG_SESSION_COOKIE=bggusername=xxx; SessionID=yyy
 * Или свали файла ръчно и добави:
 *   BGG_DUMP_FILE=./data/bg_ranks.zip
 */

import { PrismaClient }        from '@prisma/client'
import AdmZip                  from 'adm-zip'
import { gunzip }              from 'node:zlib'
import { promisify }           from 'node:util'
import * as fs                 from 'fs'
import * as path               from 'path'
import { fetchBGGHotness, fetchGamesByIds } from '../lib/bgg/client'
import type { BggGameDetails } from '../lib/bgg/types'

const gunzipAsync = promisify(gunzip)

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
  const процент   = Math.round((текущ / общо) * 100)
  const дължина   = 32
  const запълнени = Math.round((текущ / общо) * дължина)
  const лента     = '█'.repeat(запълнени) + '░'.repeat(дължина - запълнени)
  const кратко    = заглавие.slice(0, 28).padEnd(28)
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
  let current  = ''
  let inQuotes = false
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
// Парсира CSV текст → топ N ID-та
// ──────────────────────────────────────────────
function parseCSVDump(csv: string, брой: number): number[] {
  const lines   = csv.split('\n')
  const headers = parseCSVLine(lines[0])
  const idIdx   = headers.indexOf('id')
  const rankIdx = headers.indexOf('rank')
  const expIdx  = headers.indexOf('is_expansion')

  if (idIdx === -1 || rankIdx === -1) {
    throw new Error(`Непознат CSV формат. Заглавия: ${lines[0].slice(0, 120)}`)
  }

  const games: { id: number; rank: number }[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols        = parseCSVLine(line)
    const id          = parseInt(cols[idIdx]  ?? '')
    const rank        = parseInt(cols[rankIdx] ?? '')
    const isExpansion = cols[expIdx] === '1'
    if (!id || !rank || isExpansion) continue
    games.push({ id, rank })
  }

  return games
    .sort((a, b) => a.rank - b.rank)
    .slice(0, брой)
    .map((g) => g.id)
}

// ──────────────────────────────────────────────
// Разпакова буфер: ZIP → gzip → plain CSV
// ──────────────────────────────────────────────
async function разпакови(buffer: Buffer): Promise<string> {
  // ZIP
  try {
    const zip   = new AdmZip(buffer)
    const entry = zip.getEntries().find((e) => e.entryName.endsWith('.csv'))
    if (entry) return entry.getData().toString('utf8')
  } catch { /* не е ZIP */ }

  // gzip
  try {
    return (await gunzipAsync(buffer)).toString('utf8')
  } catch { /* не е gzip */ }

  // plain CSV
  const text = buffer.toString('utf8')
  if (text.trimStart().startsWith('id,') || text.trimStart().startsWith('"id"')) {
    return text
  }

  throw new Error('Неизвестен формат (не ZIP, не gzip, не CSV)')
}

// ──────────────────────────────────────────────
// Извлича топ ID-та от BGG data dump
// ──────────────────────────────────────────────
async function изтеглиТопID(брой: number): Promise<number[]> {
  // ── Локален файл (ако е зададен в .env) ──────
  const localFile = process.env.BGG_DUMP_FILE
  if (localFile) {
    if (!fs.existsSync(localFile)) {
      throw new Error(`BGG_DUMP_FILE не е намерен: ${localFile}`)
    }
    process.stdout.write(`  ⟳ Четем локален dump: ${localFile}...`)
    const buffer = fs.readFileSync(localFile)
    const csv    = await разпакови(buffer)
    const ids    = parseCSVDump(csv, брой)
    process.stdout.write(` ${ids.length} игри\n`)
    return ids
  }

  // ── Изтегли от BGG ───────────────────────────
  process.stdout.write('  ⟳ Изтеглям BGG data dump...')

  const cookie = process.env.BGG_SESSION_COOKIE
  const headers: Record<string, string> = {
    'User-Agent':      BGG_UA,
    'Accept':          'application/zip,application/octet-stream,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer':         'https://boardgamegeek.com/',
  }
  if (cookie) headers['Cookie'] = cookie

  const res = await fetch(BGG_DUMP_URL, { headers, redirect: 'follow' })

  if (!res.ok) throw new Error(`BGG data dump HTTP ${res.status}`)

  const contentType = res.headers.get('content-type') ?? ''

  // Ако BGG върна HTML — изисква вход
  if (contentType.includes('text/html')) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
    fs.writeFileSync(path.join(LOG_DIR, 'bgg-dump-response.html'), await res.text(), 'utf8')

    throw new Error(
      'BGG изисква вход за data dump.\n\n' +
      '  ── Вариант А (препоръчан): Свали ръчно докато си логнат в BGG ──\n' +
      '     1. Отвори https://boardgamegeek.com/data_dumps/bg_ranks в браузър\n' +
      '     2. Свали файла (напр. boardgames_ranks.zip)\n' +
      '     3. Добави в .env: BGG_DUMP_FILE=./data/boardgames_ranks.zip\n' +
      '     4. Пусни отново: npm run import:bgg\n\n' +
      '  ── Вариант Б: Session cookie от браузър ─────────────────────────\n' +
      '     1. Логни се в boardgamegeek.com\n' +
      '     2. Отвори DevTools → Application → Cookies → boardgamegeek.com\n' +
      '     3. Копирай стойностите на bggusername и SessionID\n' +
      '     4. Добави в .env:\n' +
      '        BGG_SESSION_COOKIE=bggusername=ТВОЕТО_ИМЕ; SessionID=ТВОЯ_ID\n' +
      '     5. Пусни отново: npm run import:bgg\n\n' +
      '  Debug HTML е записан в: logs/bgg-dump-response.html'
    )
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const csv    = await разпакови(buffer)
  const ids    = parseCSVDump(csv, брой)
  process.stdout.write(` ${ids.length} игри\n`)
  return ids
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

  // Диагностика на BGG токен
  const token = process.env.BGG_API_TOKEN
  if (token) {
    console.log(`🔑 BGG_API_TOKEN зареден: ${token.slice(0, 8)}...`)
  } else {
    console.warn('⚠  BGG_API_TOKEN не е зададен — XML API заявките може да върнат 401')
  }

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
    process.stdout.write(` ⚠ Пропуснато: ${г}\n`)
  }

  // BGG data dump
  try {
    const топId = await изтеглиТопID(БРОЙ_ИГРИ)
    топId.forEach((id) => idSet.add(id))
  } catch (г) {
    console.error(`\n❌ ${г}`)
    process.exit(1)
  }

  const allIds = [...idSet].slice(0, БРОЙ_ИГРИ)
  console.log(`\n✅ Събрани ${allIds.length} уникални ID-та\n`)

  // ── Стъпка 2: Зареди детайли батчове ────────
  console.log('📦 Стъпка 2: Зареждане на детайли от BGG XML API...\n')

  const BATCH = 200
  const всичкиИгри: BggGameDetails[] = []

  for (let i = 0; i < allIds.length; i += BATCH) {
    const батч     = allIds.slice(i, i + BATCH)
    const номБатч  = Math.floor(i / BATCH) + 1
    const общоБатч = Math.ceil(allIds.length / BATCH)
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
    if (резултат === 'успешно')         успешно++
    else if (резултат === 'пропусната') пропуснати++
    else                                грешки++
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
