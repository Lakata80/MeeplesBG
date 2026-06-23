import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.update({
    where: { email: 'endarovlazar@gmail.com' },
    data:  { role: 'ADMIN' },
    select: { email: true, role: true },
  })
  console.log('✓', user.email, '→', user.role)
}
main().finally(() => prisma.$disconnect())
