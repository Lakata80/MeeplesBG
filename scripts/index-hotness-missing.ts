import { PrismaClient } from '@prisma/client'
import { indexGame }    from '../lib/search/indexing'

const prisma  = new PrismaClient()
const BGG_IDS = [473061, 451772]

async function main() {
  const игри = await prisma.game.findMany({
    where: { bggId: { in: BGG_IDS } },
  })

  console.log(`🔍 Индексиране на ${игри.length} игри в MeiliSearch...\n`)

  for (const игра of игри) {
    await indexGame(игра)
    console.log(`✅ Индексирана: "${игра.titleEn}" → /igri/${игра.slug}`)
  }

  console.log('\n✅ Готово!')
}

main()
  .catch((г) => { console.error('\n❌ Грешка:', г); process.exit(1) })
  .finally(() => prisma.$disconnect())
