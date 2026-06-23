import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const games = await prisma.game.findMany({ select: { mechanics: true }, where: { isActive: true } })
  const all = new Set(games.flatMap((g) => g.mechanics))
  const sorted = [...all].sort()
  console.log('Уникални механики:', all.size)
  sorted.forEach((m) => console.log(' -', m))
}

main().finally(() => prisma.$disconnect())
