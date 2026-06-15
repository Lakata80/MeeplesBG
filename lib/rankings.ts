import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'

// ── Дефиниции на категориите ──────────────────────────────────

export interface КатегорияКласация {
  slug:            string
  заглавие:        string
  пълноЗаглавие:   string
  описание:        string
  икона:           string
}

export const КАТЕГОРИИ_КЛАСАЦИИ: КатегорияКласация[] = [
  {
    slug:           'top-100',
    заглавие:       'Топ 100 общо',
    пълноЗаглавие:  'Топ 100 Настолни Игри',
    описание:       'Най-добрите 100 настолни игри в света по оценка на BoardGameGeek.',
    икона:          '🏆',
  },
  {
    slug:           'top-strategia',
    заглавие:       'Топ 100 Стратегии',
    пълноЗаглавие:  'Топ 100 Стратегически Игри',
    описание:       'Най-добрите стратегически настолни игри за любители на дълбоко мислене.',
    икона:          '♟️',
  },
  {
    slug:           'top-voyna',
    заглавие:       'Топ 100 Военни',
    пълноЗаглавие:  'Топ 100 Военни Настолни Игри',
    описание:       'Епични битки и стратегически кампании — най-добрите военни игри.',
    икона:          '⚔️',
  },
  {
    slug:           'top-semeyni',
    заглавие:       'Топ 100 Семейни',
    пълноЗаглавие:  'Топ 100 Семейни Настолни Игри',
    описание:       'Игри за цялото семейство — подходящи за деца и възрастни заедно.',
    икона:          '👨‍👩‍👧‍👦',
  },
  {
    slug:           'top-kooperativni',
    заглавие:       'Топ 100 Кооперативни',
    пълноЗаглавие:  'Топ 100 Кооперативни Настолни Игри',
    описание:       'Играйте заедно срещу играта — кооперативните игри изискват екипна работа.',
    икона:          '🤝',
  },
  {
    slug:           'top-za-dvama',
    заглавие:       'Топ 100 За двама',
    пълноЗаглавие:  'Топ 100 Настолни Игри За Двама',
    описание:       'Най-добрите игри специално за двама играчи — идеални за двойки и приятели.',
    икона:          '💑',
  },
]

// ── Тип на върнатата игра ────────────────────────────────────

export type КласациоИгра = {
  id:            string
  slug:          string
  titleBg:       string
  titleEn:       string | null
  yearPublished: number | null
  minPlayers:    number | null
  maxPlayers:    number | null
  bggRating:     number | null
  ourRating:     number | null
  weight:        number | null
  thumbnailUrl:  string | null
  imageUrl:      string | null
  types:         string[]
}

// ── Вътрешна заявка ──────────────────────────────────────────

const ИЗБОР = {
  id: true, slug: true, titleBg: true, titleEn: true,
  yearPublished: true, minPlayers: true, maxPlayers: true,
  bggRating: true, ourRating: true, weight: true,
  thumbnailUrl: true, imageUrl: true, types: true,
} as const

const ПОДРЕЖДАНЕ = [{ bggRating: { sort: 'desc' as const, nulls: 'last' as const } }]

async function заявка(
  where: Prisma.GameWhereInput,
  limit: number,
): Promise<КласациоИгра[]> {
  return prisma.game.findMany({
    where,
    orderBy: ПОДРЕЖДАНЕ,
    take:    limit,
    select:  ИЗБОР,
  }) as Promise<КласациоИгра[]>
}

// ── Публична функция ─────────────────────────────────────────

export async function getRanking(
  slug:  string,
  limit: number = 100,
): Promise<КласациоИгра[] | null> {
  const base = { isActive: true, bggRating: { not: null } }

  switch (slug) {
    case 'top-100':
      return заявка({ ...base }, limit)

    case 'top-strategia':
      return заявка({ ...base, types: { has: 'Strategy' } }, limit)

    case 'top-voyna':
      return заявка({
        ...base,
        OR: [
          { types: { has: 'Wargames' } },
          { categories: { hasSome: ['Wargame', 'War', 'Wargames'] } },
        ],
      }, limit)

    case 'top-semeyni':
      return заявка({ ...base, types: { has: 'Family' } }, limit)

    case 'top-kooperativni':
      return заявка({
        ...base,
        mechanics: { hasSome: ['Co-operative Play', 'Cooperative Game'] },
      }, limit)

    case 'top-za-dvama':
      return заявка({
        ...base,
        minPlayers: { lte: 2 },
        maxPlayers: { gte: 2 },
      }, limit)

    default:
      return null
  }
}

export function getCategory(slug: string): КатегорияКласация | undefined {
  return КАТЕГОРИИ_КЛАСАЦИИ.find((к) => к.slug === slug)
}
