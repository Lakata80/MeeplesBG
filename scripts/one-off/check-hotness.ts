import { PrismaClient } from '@prisma/client'
import { fetchBGGHotness } from '../lib/bgg/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔥 Проверка на BGG Hotness срещу базата...\n')

  const горещи = await fetchBGGHotness()
  const топ10  = горещи.slice(0, 10)

  const bggIds = топ10.map((г) => г.id)

  const вБазата = await prisma.game.findMany({
    where: { bggId: { in: bggIds } },
    select: { bggId: true, slug: true, titleBg: true, titleEn: true, isActive: true },
  })

  const намерени = new Map(вБазата.map((г) => [г.bggId, г]))

  console.log('Топ 10 от BGG Hotness:\n')
  console.log('№   BGG ID   Статус         Заглавие (BGG)')
  console.log('─'.repeat(70))

  const липсващи: typeof топ10 = []
  const неактивни: typeof топ10 = []

  for (const игра of топ10) {
    const вБ = намерени.get(игра.id)
    let статус: string

    if (!вБ) {
      статус = '❌ ЛИПСВА'
      липсващи.push(игра)
    } else if (!вБ.isActive) {
      статус = '⚠️  неактивна'
      неактивни.push(игра)
    } else {
      статус = '✅ OK'
    }

    const pad = (s: string, n: number) => s.slice(0, n).padEnd(n)
    console.log(
      `${String(игра.rank).padStart(2)}  ${String(игра.id).padStart(7)}  ${pad(статус, 14)}  ${игра.name}${игра.yearPublished ? ` (${игра.yearPublished})` : ''}`
    )

    if (вБ) {
      console.log(`                              → slug: ${вБ.slug}, titleBg: "${вБ.titleBg}"`)
    }
  }

  console.log('\n' + '─'.repeat(70))

  if (липсващи.length === 0 && неактивни.length === 0) {
    console.log('✅ Всички топ 10 игри са в базата и са активни!')
  } else {
    if (липсващи.length > 0) {
      console.log(`\n❌ Липсват ${липсващи.length} игри (не са в базата):`)
      for (const г of липсващи) {
        console.log(`   BGG ID ${г.id} — "${г.name}" — https://boardgamegeek.com/boardgame/${г.id}`)
      }
    }
    if (неактивни.length > 0) {
      console.log(`\n⚠️  ${неактивни.length} игри са в базата, но isActive=false:`)
      for (const г of неактивни) {
        const вБ = намерени.get(г.id)!
        console.log(`   BGG ID ${г.id} — "${г.name}" → slug: ${вБ.slug}`)
      }
    }

    console.log('\nЗа да ги добавиш, пусни: npm run import:bgg')
    console.log('(Ако искаш само тези конкретни игри, добави bggId-тата ръчно)')
  }
}

main()
  .catch((г) => { console.error('\n❌ Грешка:', г); process.exit(1) })
  .finally(() => prisma.$disconnect())
