import { prisma } from '@/lib/prisma'
import type { BggHotnessItem } from './types'

export async function getHotness(): Promise<BggHotnessItem[]> {
  const items = await prisma.hotnessItem.findMany({
    orderBy: { rank: 'asc' },
  })
  return items.map((i) => ({
    id:            i.bggId,
    rank:          i.rank,
    name:          i.name,
    yearPublished: i.yearPublished ?? undefined,
    thumbnailUrl:  i.thumbnailUrl ?? undefined,
  }))
}
