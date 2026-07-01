import type { MetadataRoute } from 'next'
import { prisma }             from '@/lib/prisma'
import { getAllPostSlugs, getAllWeeklyGameSlugs } from '@/lib/sanity/queries'
import { КАТЕГОРИИ_КЛАСАЦИИ } from '@/lib/rankings'

const САЙТ = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://meeplesbg.com'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const статични: MetadataRoute.Sitemap = [
    { url: САЙТ,                             changeFrequency: 'daily',   priority: 1.0 },
    { url: `${САЙТ}/igri`,                   changeFrequency: 'daily',   priority: 0.9 },
    { url: `${САЙТ}/novini`,                 changeFrequency: 'daily',   priority: 0.8 },
    { url: `${САЙТ}/top`,                    changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${САЙТ}/igri/populiarni`,        changeFrequency: 'daily',   priority: 0.8 },
    { url: `${САЙТ}/obshtnost`,              changeFrequency: 'daily',   priority: 0.7 },
    { url: `${САЙТ}/igri/igra-na-sedmicata`, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${САЙТ}/mehaniki`,               changeFrequency: 'monthly', priority: 0.6 },
    { url: `${САЙТ}/kontakti`,               changeFrequency: 'monthly', priority: 0.4 },
    { url: `${САЙТ}/gdpr`,                   changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${САЙТ}/biskvitki`,              changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${САЙТ}/pravila`,                changeFrequency: 'yearly',  priority: 0.2 },
  ]

  const [игриБД, slugове, weeklyslugове, механикиБД] = await Promise.all([
    prisma.game.findMany({
      where:   { isActive: true },
      orderBy: [{ bggRating: { sort: 'desc', nulls: 'last' } }],
      take:    1000,
      select:  { slug: true, updatedAt: true },
    }).catch(() => []),
    getAllPostSlugs().catch(() => []),
    getAllWeeklyGameSlugs().catch(() => []),
    prisma.mechanic.findMany({
      select: { slug: true },
      orderBy: { name: 'asc' },
    }).catch(() => []),
  ])

  const игриПътища: MetadataRoute.Sitemap = игриБД.map((и) => ({
    url:             `${САЙТ}/igri/${и.slug}`,
    lastModified:    и.updatedAt,
    changeFrequency: 'weekly' as const,
    priority:        0.7,
  }))

  const статии: MetadataRoute.Sitemap = slugове.map((slug) => ({
    url:             `${САЙТ}/novini/${slug}`,
    changeFrequency: 'monthly' as const,
    priority:        0.6,
  }))

  const класации: MetadataRoute.Sitemap = КАТЕГОРИИ_КЛАСАЦИИ.map((к) => ({
    url:             `${САЙТ}/top/${к.slug}`,
    changeFrequency: 'weekly' as const,
    priority:        0.7,
  }))

  const weeklyИгри: MetadataRoute.Sitemap = weeklyslugове.map((slug) => ({
    url:             `${САЙТ}/igri/igra-na-sedmicata/${slug}`,
    changeFrequency: 'yearly' as const,
    priority:        0.6,
  }))

  const механикиПътища: MetadataRoute.Sitemap = механикиБД.map((м) => ({
    url:             `${САЙТ}/mehaniki/${м.slug}`,
    changeFrequency: 'monthly' as const,
    priority:        0.5,
  }))

  return [...статични, ...игриПътища, ...статии, ...класации, ...weeklyИгри, ...механикиПътища]
}
