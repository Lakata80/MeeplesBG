import { PrismaClient } from '@prisma/client'

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx scripts/make-admin.ts <email>')
  process.exit(1)
}

const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.update({
    where: { email },
    data:  { role: 'ADMIN' },
    select: { email: true, role: true },
  })
  console.log('✓', user.email, '→', user.role)
}
main().finally(() => prisma.$disconnect())
