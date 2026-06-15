/**
 * Скрипт за пълно преиндексиране на игрите в MeiliSearch
 * Употреба: npm run import:reindex
 */

import { PrismaClient } from '@prisma/client'
import клиент from '../lib/search/client'
import { configureIndex, indexAllGames } from '../lib/search/indexing'

const prisma = new PrismaClient()
const ИНДЕКС = 'games'

function прогрес(индексирани: number, общо: number) {
  if (общо === 0) return
  const процент = Math.round((индексирани / общо) * 100)
  const дължина = 36
  const запълнени = Math.round((индексирани / общо) * дължина)
  const лента = '█'.repeat(запълнени) + '░'.repeat(дължина - запълнени)
  process.stdout.write(
    `\r[${лента}] ${String(индексирани).padStart(5)}/${общо} (${String(процент).padStart(3)}%)`
  )
}

async function main() {
  // ── Проверка на конфигурацията ───────────────
  const url  = process.env.MEILISEARCH_URL ?? 'http://localhost:7700'
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error('\n❌ DATABASE_URL не е зададен!')
    process.exit(1)
  }

  console.log('🔍 MeeplesBG — Преиндексиране в MeiliSearch')
  console.log('═'.repeat(56))
  console.log(`   MeiliSearch: ${url}`)
  console.log()

  // ── Здравен тест на MeiliSearch ──────────────
  try {
    const здраве = await клиент.health()
    console.log(`✅ MeiliSearch работи (статус: ${здраве.status})`)
  } catch (грешка) {
    console.error(`❌ MeiliSearch не е достъпен на ${url}`)
    console.error('   Провери MEILISEARCH_URL и дали сървърът е стартиран.')
    process.exit(1)
  }

  // ── Изтрий стария индекс ─────────────────────
  console.log('\n🗑️  Изтриване на стария индекс...')
  try {
    const задача = await клиент.deleteIndex(ИНДЕКС)
    await клиент.tasks.waitForTask(задача.taskUid, { timeout: 30_000 })
    console.log('   ✓ Индексът е изтрит')
  } catch {
    console.log('   ℹ Индексът не съществуваше — пропускам')
  }

  // ── Създай нов индекс ────────────────────────
  console.log('\n📦 Създаване на нов индекс...')
  const задачаСъздаване = await клиент.createIndex(ИНДЕКС, { primaryKey: 'id' })
  await клиент.tasks.waitForTask(задачаСъздаване.taskUid, { timeout: 30_000 })
  console.log('   ✓ Индексът е създаден')

  // ── Конфигурирай атрибутите ──────────────────
  console.log('\n⚙️  Конфигуриране на атрибутите...')
  await configureIndex()
  console.log('   ✓ Атрибутите са конфигурирани')
  console.log('   Searchable : titleBg, titleEn, descriptionBg, categories, mechanics')
  console.log('   Filterable : minPlayers, maxPlayers, minAge, maxPlaytime, weight,')
  console.log('                types, categories, yearPublished, bggRating, ourRating')
  console.log('   Sortable   : bggRating, ourRating, yearPublished, titleBg')

  // ── Индексирай игрите ────────────────────────
  console.log('\n🎲 Индексиране на игри...\n')

  const общо = await indexAllGames(
    prisma as Parameters<typeof indexAllGames>[0],
    прогрес
  )

  if (общо === 0) {
    console.log('\n   ℹ Няма активни игри в базата за индексиране.')
    console.log('   Пусни `npm run import:bgg` първо.')
  } else {
    console.log(`\n\n✅ Индексирани ${общо} игри успешно!`)
  }

  // ── Обобщение ────────────────────────────────
  console.log()
  console.log('═'.repeat(56))
  try {
    const статистики = await клиент.index(ИНДЕКС).getStats()
    console.log(`📊 Документи в индекса: ${статистики.numberOfDocuments}`)
    console.log(`   Статус: ${статистики.isIndexing ? 'индексира...' : 'готов'}`)
  } catch {}
  console.log('═'.repeat(56))
  console.log('\n🎉 Преиндексирането е завършено!')
  console.log(`   Тествай: curl "${url}/indexes/${ИНДЕКС}/search" -d \'{"q":"wingspan"}\'`)
}

main()
  .catch((грешка) => {
    console.error('\n❌ Фатална грешка:', грешка)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
