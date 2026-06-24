export type ThreadCategorySlug = 'izbor' | 'pravila' | 'pazar' | 'sreshti'

export const КАТЕГОРИИ = {
  izbor: {
    slug:  'izbor',
    db:    'IZBOR',
    label: 'Помощ при избор',
    desc:  'Не знаеш коя игра да вземеш? Питай тук.',
    icon:  '🤔',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
  },
  pravila: {
    slug:  'pravila',
    db:    'PRAVILA',
    label: 'Правила и стратегии',
    desc:  'Въпроси за правила, стратегии и тактики.',
    icon:  '📖',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
  },
  pazar: {
    slug:  'pazar',
    db:    'PAZAR',
    label: 'Купувам / Продавам / Разменям',
    desc:  'Вторичен пазар за настолни игри.',
    icon:  '🛒',
    color: 'bg-green-50 border-green-200 text-green-700',
    badge: 'bg-green-100 text-green-700',
  },
  sreshti: {
    slug:  'sreshti',
    db:    'SRESHTI',
    label: 'Игрални срещи',
    desc:  'Организирай или се присъедини към игрална среща.',
    icon:  '🗓️',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    badge: 'bg-orange-100 text-orange-700',
  },
} as const

export const DB_КЪМ_SLUG: Record<string, ThreadCategorySlug> = {
  IZBOR:   'izbor',
  PRAVILA: 'pravila',
  PAZAR:   'pazar',
  SRESHTI: 'sreshti',
}

export function getКатегория(slug: string) {
  return КАТЕГОРИИ[slug as ThreadCategorySlug] ?? null
}

export const ОТНОСИТЕЛНО_ВРЕМЕ = new Intl.RelativeTimeFormat('bg', { numeric: 'auto' })

export function относителноВреме(date: Date | string): string {
  const diff = (new Date(date).getTime() - Date.now()) / 1000
  if (Math.abs(diff) < 60)    return 'преди малко'
  if (Math.abs(diff) < 3600)  return ОТНОСИТЕЛНО_ВРЕМЕ.format(Math.round(diff / 60), 'minute')
  if (Math.abs(diff) < 86400) return ОТНОСИТЕЛНО_ВРЕМЕ.format(Math.round(diff / 3600), 'hour')
  return ОТНОСИТЕЛНО_ВРЕМЕ.format(Math.round(diff / 86400), 'day')
}
