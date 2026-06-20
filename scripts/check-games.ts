import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  const games = await p.game.findMany({
    where: { OR: [
      { titleEn: { contains: 'Star Wars', mode: 'insensitive' } },
      { titleEn: { contains: 'Europa Universalis', mode: 'insensitive' } },
      { slug: 'star-wars-rebellion' },
      { slug: 'europa-universalis-the-price-of-power' },
    ]},
    select: { titleEn: true, slug: true, bggId: true },
  })
  console.log(`Намерени: ${games.length}`)
  console.log(JSON.stringify(games, null, 2))

  const total = await p.game.count()
  console.log(`\nОбщо игри в базата: ${total}`)
}

main().finally(() => p.$disconnect())
