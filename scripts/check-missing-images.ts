import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Провери конкретната игра
  const игра = await prisma.game.findUnique({
    where: { slug: 'people-power-insurgency-in-the-philippines-1981-1986' },
    select: { id: true, titleEn: true, bggId: true, imageUrl: true, thumbnailUrl: true, isActive: true },
  })

  console.log('\n── Конкретна игра ──')
  if (!игра) {
    console.log('❌ Играта НЕ е намерена в базата по slug!')
  } else {
    console.log(`Заглавие:  ${игра.titleEn}`)
    console.log(`BGG ID:    ${игра.bggId}`)
    console.log(`isActive:  ${игра.isActive}`)
    console.log(`imageUrl:  ${игра.imageUrl ?? '(null)'}`)
    console.log(`thumbnail: ${игра.thumbnailUrl ?? '(null)'}`)
  }

  // Общ брой игри
  const общо = await prisma.game.count()

  // Игри без imageUrl
  const безСнимка = await prisma.game.count({
    where: { OR: [{ imageUrl: null }, { imageUrl: '' }] },
  })

  console.log(`\n── Статистика ──`)
  console.log(`Общо игри:           ${общо}`)
  console.log(`Без imageUrl:        ${безСнимка}`)
  console.log(`С imageUrl:          ${общо - безСнимка}`)

  // Списък на игрите без снимка (до 50)
  const списък = await prisma.game.findMany({
    where: { OR: [{ imageUrl: null }, { imageUrl: '' }] },
    select: { slug: true, titleEn: true, bggId: true, isActive: true },
    orderBy: { bggRating: { sort: 'desc', nulls: 'last' } },
    take: 50,
  })

  console.log(`\n── Игри без снимка (топ ${списък.length} по BGG рейтинг) ──`)
  for (const г of списък) {
    console.log(`  [bggId=${г.bggId}] active=${г.isActive}  /igri/${г.slug}`)
    console.log(`    ${г.titleEn}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
