import { redirect }  from 'next/navigation'
import { auth }      from '@/auth'
import { prisma }    from '@/lib/prisma'
import FeaturedClient from './FeaturedClient'

export const metadata = { title: 'Препоръчани секции — MeeplesBG' }

export default async function FeaturedPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/featured')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') redirect('/')

  return <FeaturedClient />
}
