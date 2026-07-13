import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main() {
  const g = await p.game.findFirst({
    where: { titleEn: { contains: 'Kingdom Come', mode: 'insensitive' } },
    select: { bggId: true, slug: true, titleEn: true, titleBg: true, createdAt: true, descriptionBg: true },
  })
  console.log(g ? JSON.stringify(g, null, 2) : 'Не е намерена!')
}
main().finally(() => p.$disconnect())
