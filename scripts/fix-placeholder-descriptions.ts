import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Намери точния текст
  const игра = await prisma.game.findFirst({
    where: { slug: 'aeon-trespass-odyssey' },
    select: { descriptionBg: true }
  })
  console.log('descriptionBg:', JSON.stringify(игра?.descriptionBg?.slice(0, 200)))
}

main()
  .catch((err) => { console.error('Грешка:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
