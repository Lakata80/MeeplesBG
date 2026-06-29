import { redirect }          from 'next/navigation'
import { auth }              from '@/auth'
import { prisma }            from '@/lib/prisma'
import PendingImagesClient   from './PendingImagesClient'

export const metadata = { title: 'Снимки за одобрение — MeeplesBG' }

export default async function PendingImagesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/admin/pending-images')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') redirect('/')

  return <PendingImagesClient />
}
