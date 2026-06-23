import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const игри = await prisma.game.findMany({
    where: { slug: { contains: 'pandemic-legacy-season-1' } },
    select: { titleEn: true, slug: true, types: true, categories: true }
  })
  for (const г of игри) {
    console.log(г.titleEn, '-', г.slug)
    console.log('  types:', JSON.stringify(г.types))
    console.log('  categories:', JSON.stringify(г.categories))
  }
  // Колко игри имат Thematic в types изобщо?
  const count = await prisma.game.count({ where: { types: { has: 'Thematic' } } })
  console.log('\nИгри с types=Thematic:', count)
}
main().finally(() => prisma.$disconnect())
