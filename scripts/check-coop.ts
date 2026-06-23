import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  // Маркирай счупения APPROVED запис (сочи към основната снимка) като REJECTED
  const result = await prisma.pendingImage.updateMany({
    where: { status: 'APPROVED', url: { contains: 'games/242705.webp' } },
    data:  { status: 'REJECTED' },
  })
  console.log('Изчистени счупени записи:', result.count)

  // Покажи текущото състояние
  const all = await prisma.pendingImage.findMany({
    include: { game: { select: { slug: true } } }
  })
  all.forEach(p => console.log(p.status.padEnd(10), p.url.slice(-50), p.game.slug))
}
main().finally(() => prisma.$disconnect())
