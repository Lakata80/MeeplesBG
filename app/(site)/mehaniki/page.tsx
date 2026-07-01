import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import MehanikiBrowser from '@/components/mehaniki/MehanikiBrowser'
import type { MechanikData } from '@/components/mehaniki/MehanikiBrowser'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Механики | MeeplesBG',
  description:
    'Открий механиките на настолните игри — от поставяне на работници до кооперативни игри. Намери игри по стила, който ти харесва.',
}

export default async function МеханикиСтраница() {
  let механики: MechanikData[] = []
  try {
    const rows = await prisma.$queryRaw<
      Array<{ slug: string; name: string; descriptionBg: string | null; gameCount: bigint }>
    >`
      SELECT
        m.slug,
        m.name,
        m."descriptionBg",
        COUNT(g.id) AS "gameCount"
      FROM "Mechanic" m
      LEFT JOIN "Game" g ON m.name = ANY(g.mechanics) AND g."isActive" = true
      GROUP BY m.id, m.slug, m.name, m."descriptionBg"
      ORDER BY "gameCount" DESC
    `
    механики = rows.map((r) => ({
      slug:          r.slug,
      name:          r.name,
      descriptionBg: r.descriptionBg,
      gameCount:     Number(r.gameCount),
    }))
  } catch {
    // DB не е достъпна при build time; ISR ще регенерира страницата при първото посещение
  }

  return <MehanikiBrowser механики={механики} />
}
