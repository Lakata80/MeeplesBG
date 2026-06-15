import Link          from 'next/link'
import type { Metadata } from 'next'
import ForumLink     from '@/components/ui/ForumLink'

export const revalidate = 300 // 5 минути

export const metadata: Metadata = {
  title:       'Форум | MeeplesBG',
  description: 'Обсъждай настолни игри, питай съвети и се запознай с общността на MeeplesBG.',
}

// ── Типове на Discourse API ──────────────────────────────────

interface DiscourseTopic {
  id:             number
  title:          string
  slug:           string
  posts_count:    number
  reply_count:    number
  views:          number
  last_posted_at: string
  category_id:    number
  pinned:         boolean
  closed:         boolean
}

interface DiscourseLatest {
  topic_list?: {
    topics: DiscourseTopic[]
  }
}

// ── Зареждане на теми ────────────────────────────────────────

async function getLatestTopics(): Promise<DiscourseTopic[]> {
  const discourseUrl = process.env.DISCOURSE_URL
  if (!discourseUrl) return []

  try {
    const res = await fetch(`${discourseUrl}/latest.json`, {
      headers: { Accept: 'application/json' },
      next:    { revalidate: 300 },
    })
    if (!res.ok) return []

    const данни = (await res.json()) as DiscourseLatest
    const теми  = данни.topic_list?.topics ?? []

    // Изключи системни теми (category_id === -1 или пинените системни)
    return теми.filter((т) => т.id !== 1 && т.id !== 3).slice(0, 15)
  } catch {
    return []
  }
}

// ── Форматиране ───────────────────────────────────────────────

const ФОРМАТ_ДАТА = new Intl.DateTimeFormat('bg-BG', { dateStyle: 'medium' })

function форматДата(iso: string): string {
  return ФОРМАТ_ДАТА.format(new Date(iso))
}

function форматВреме(iso: string): string {
  const дата = new Date(iso)
  const сега = new Date()
  const мс   = сега.getTime() - дата.getTime()
  const мин  = Math.floor(мс / 60_000)
  const часа = Math.floor(мин / 60)
  const дни  = Math.floor(часа / 24)

  if (мин < 60)   return `преди ${мин} мин`
  if (часа < 24)  return `преди ${часа} ч`
  if (дни < 7)    return `преди ${дни} дни`
  return форматДата(iso)
}

// ── Ред с тема ────────────────────────────────────────────────

function ТемаРед({ тема }: { тема: DiscourseTopic }) {
  const discourseUrl = process.env.NEXT_PUBLIC_DISCOURSE_URL ?? 'https://forum.meeplebg.com'
  const href         = `${discourseUrl}/t/${тема.slug}/${тема.id}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors group"
    >
      {/* Иконка */}
      <div className="mt-0.5 w-9 h-9 shrink-0 rounded-lg bg-blue-100 flex items-center justify-center text-base">
        {тема.pinned ? '📌' : тема.closed ? '🔒' : '💬'}
      </div>

      {/* Съдържание */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug truncate">
          {тема.title}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span>{тема.posts_count} {тема.posts_count === 1 ? 'отговор' : 'отговора'}</span>
          <span>·</span>
          <span>{тема.views} преглед{тема.views === 1 ? '' : 'а'}</span>
          <span>·</span>
          <span>{форматВреме(тема.last_posted_at)}</span>
        </div>
      </div>

      <span className="hidden sm:block text-xs text-gray-300 group-hover:text-blue-400 mt-1 transition-colors shrink-0">
        →
      </span>
    </a>
  )
}

// ── Главна страница ───────────────────────────────────────────

export default async function ФорумСтраница() {
  const теми        = await getLatestTopics()
  const discourseUrl = process.env.DISCOURSE_URL
  const недостъпен  = !discourseUrl

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">

      {/* Заглавие */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">💬 Форум</h1>
          <p className="text-gray-500 text-sm">
            Обсъждай, питай и споделяй с общността на MeeplesBG.
          </p>
        </div>
        <ForumLink className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shrink-0">
          Отвори форума →
        </ForumLink>
      </div>

      {/* Последни теми */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-0">
          Последни теми
        </h2>

        {недостъпен ? (
          <div className="py-10 text-center text-gray-400">
            <div className="text-4xl mb-3">⚙️</div>
            <p className="text-sm font-medium text-gray-600">Форумът не е конфигуриран</p>
            <p className="text-xs mt-1">Задайте DISCOURSE_URL в .env.local</p>
          </div>
        ) : теми.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-medium text-gray-600">Няма активни теми</p>
            <p className="text-xs mt-1">Форумът може да е временно недостъпен.</p>
          </div>
        ) : (
          <div>
            {теми.map((тема) => (
              <ТемаРед key={тема.id} тема={тема} />
            ))}
          </div>
        )}
      </div>

      {/* Категории / CTA */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { икона: '🎲', надпис: 'Препоръки',    href: '/forum/c/препоръки' },
          { икона: '🏆', надпис: 'Наредби',       href: '/forum/c/правила' },
          { икона: '🤝', надпис: 'Размени',       href: '/forum/c/размени' },
        ].map((кат) => (
          <ForumLink
            key={кат.надпис}
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group"
          >
            <span className="text-2xl">{кат.икона}</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              {кат.надпис}
            </span>
          </ForumLink>
        ))}
      </div>

      {/* Съвет за SSO */}
      <div className="mt-8 bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        <strong>Съвет:</strong> Входът в MeeplesBG автоматично ви влиза и в Discourse форума —
        не е нужно да се регистрирате отново.
      </div>
    </div>
  )
}
