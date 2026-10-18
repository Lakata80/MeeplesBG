import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const безСнимкаФилтър = { OR: [{ imageUrl: null }, { imageUrl: '' }] } as const

async function main() {
  const [общо, безСнимка, разширенияБезСнимка, базовиБезСнимка] = await Promise.all([
    prisma.game.count(),
    prisma.game.count({ where: безСнимкаФилтър }),
    prisma.game.count({ where: { ...безСнимкаФилтър, baseGameId: { not: null } } }),
    prisma.game.count({ where: { ...безСнимкаФилтър, baseGameId: null } }),
  ])

  console.log(`\n── Статистика ──`)
  console.log(`Общо игри:                    ${общо}`)
  console.log(`Без снимка (всичко):          ${безСнимка}`)
  console.log(`  от които базови игри:       ${базовиБезСнимка}`)
  console.log(`  от които разширения:        ${разширенияБезСнимка}`)

  const списък = await prisma.game.findMany({
    where: { ...безСнимкаФилтър, baseGameId: null },
    select: { slug: true, titleEn: true, titleBg: true, bggId: true, bggRating: true },
    orderBy: { bggRating: { sort: 'desc', nulls: 'last' } },
  })

  console.log(`\n── Базови игри без снимка (${списък.length}), наредени по BGG рейтинг ──`)
  for (const г of списък) {
    const рейтинг = г.bggRating != null ? г.bggRating.toFixed(2) : '  —  '
    const заглавие = г.titleBg || г.titleEn || '(без заглавие)'
    console.log(`  ${рейтинг}  [${г.bggId}]  ${заглавие}`)
    console.log(`         /igri/${г.slug}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
