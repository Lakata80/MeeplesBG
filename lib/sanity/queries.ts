import type { PortableTextBlock } from '@portabletext/types'
import { sanityClient } from './client'

// ── Типове ────────────────────────────────────────────────────

export type КатегорияСтатия = 'NEWS' | 'REVIEW' | 'BLOG' | 'GUIDE'

export type SanityАвтор = {
  _id:   string
  name:  string
  image?: SanityИзображение
  bio?:  string
}

export type SanityИзображение = {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
  hotspot?: { x: number; y: number; height: number; width: number }
  alt?: string
}

export type СтатияКарта = {
  _id:         string
  title:       string
  slug:        { current: string }
  excerpt?:    string
  mainImage?:  SanityИзображение
  publishedAt: string
  category:    КатегорияСтатия
  author?:     Pick<SanityАвтор, 'name' | 'image'>
}

export type СтатияПълна = СтатияКарта & {
  body?:   PortableTextBlock[]
  author?: SanityАвтор
}

// ── Помощни константи ─────────────────────────────────────────

const КАРТА_ПОЛЕТА = `
  _id, title, slug, excerpt, mainImage, publishedAt, category,
  author->{ name, image }
`

// ── GROQ заявки ───────────────────────────────────────────────

export async function getAllPosts(
  limit:  number = 10,
  offset: number = 0,
): Promise<{ posts: СтатияКарта[]; total: number }> {
  const ФИЛТЪР = `_type == "post" && defined(publishedAt) && publishedAt <= now()`

  const [posts, total] = await Promise.all([
    sanityClient.fetch<СтатияКарта[]>(
      `*[${ФИЛТЪР}] | order(publishedAt desc) [$offset...$end] { ${КАРТА_ПОЛЕТА} }`,
      { offset, end: offset + limit },
    ),
    sanityClient.fetch<number>(`count(*[${ФИЛТЪР}])`),
  ])

  return { posts, total }
}

export async function getPostsByCategory(
  category: КатегорияСтатия,
  limit:    number = 10,
  offset:   number = 0,
): Promise<{ posts: СтатияКарта[]; total: number }> {
  const ФИЛТЪР = `_type == "post" && category == $category && defined(publishedAt) && publishedAt <= now()`

  const [posts, total] = await Promise.all([
    sanityClient.fetch<СтатияКарта[]>(
      `*[${ФИЛТЪР}] | order(publishedAt desc) [$offset...$end] { ${КАРТА_ПОЛЕТА} }`,
      { category, offset, end: offset + limit },
    ),
    sanityClient.fetch<number>(`count(*[${ФИЛТЪР}])`, { category }),
  ])

  return { posts, total }
}

export async function getPostBySlug(slug: string): Promise<СтатияПълна | null> {
  return sanityClient.fetch<СтатияПълна | null>(
    `*[_type == "post" && slug.current == $slug][0] {
      _id, title, slug, excerpt, mainImage, publishedAt, category, body,
      author->{ _id, name, image, bio }
    }`,
    { slug },
  )
}

export async function getRelatedPosts(
  category: КатегорияСтатия,
  excludeId: string,
  limit: number = 3,
): Promise<СтатияКарта[]> {
  return sanityClient.fetch<СтатияКарта[]>(
    `*[_type == "post" && category == $category && _id != $excludeId && defined(publishedAt) && publishedAt <= now()]
      | order(publishedAt desc)[0...$limit] { ${КАРТА_ПОЛЕТА} }`,
    { category, excludeId, limit },
  )
}

export async function getAllPostSlugs(): Promise<string[]> {
  const res = await sanityClient.fetch<{ slug: { current: string } }[]>(
    `*[_type == "post" && defined(publishedAt) && defined(slug.current)]{ slug }`,
  )
  return res.map((p) => p.slug.current)
}

// ── Игра на седмицата ─────────────────────────────────────

export type WeeklyGame = {
  _id:         string
  slug:        { current: string }
  gameSlug:    string
  gameName:    string
  weekLabel?:  string
  headlineBg:  string
  teaserBg?:   string
  bannerImage?: SanityИзображение
  isActive:    boolean
}

export async function getWeeklyGameBySlug(slug: string): Promise<WeeklyGame | null> {
  return sanityClient.fetch<WeeklyGame | null>(
    `*[_type == "weeklyGame" && slug.current == $slug][0] {
      _id, slug, gameSlug, gameName, weekLabel, headlineBg, teaserBg, bannerImage, isActive
    }`,
    { slug },
  )
}

export async function getActiveWeeklyGame(): Promise<WeeklyGame | null> {
  return sanityClient.fetch<WeeklyGame | null>(
    `*[_type == "weeklyGame" && isActive == true] | order(_createdAt desc)[0] {
      _id, slug, gameSlug, gameName, weekLabel, headlineBg, teaserBg, bannerImage, isActive
    }`,
  )
}

export async function getAllWeeklyGameSlugs(): Promise<string[]> {
  const res = await sanityClient.fetch<{ slug: { current: string } }[]>(
    `*[_type == "weeklyGame" && defined(slug.current)]{ slug }`,
  )
  return res.map((w) => w.slug.current)
}
