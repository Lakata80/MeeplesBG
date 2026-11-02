import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const slug = process.argv[2] ?? 'gay-dating-game'
  const игра = await prisma.game.findFirst({
    where: { slug },
    select: { titleEn: true, descriptionBg: true, descriptionEn: true }
  })
  if (!игра) { console.log('Играта не е намерена:', slug); return }
  console.log(`\n=== ${игра.titleEn} (${slug}) ===\n`)
  console.log('--- BG ---\n' + игра.descriptionBg)
  console.log('\n--- EN ---\n' + игра.descriptionEn)
}

main()
  .catch((err) => { console.error('Грешка:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
