import type { Metadata }  from 'next'
import { notFound }        from 'next/navigation'
import { headers }         from 'next/headers'
import Link                from 'next/link'
import Image               from 'next/image'
import { prisma }          from '@/lib/prisma'
import CopyLinkButton      from '@/components/top9/CopyLinkButton'

export const dynamic = 'force-dynamic'

type Params = Promise<{ shareToken: string }>

// ── Данни ──────────────────────────────────────────────────────

const МЕСЕЦИ = [
  'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
  'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември',
]

async function getTop9(shareToken: string) {
  return prisma.monthlyTop9.findUnique({
    where: { shareToken },
    include: {
      user: { select: { name: true, bggUsername: true, image: true, id: true } },
      entries: {
        orderBy: { position: 'asc' },
        include: {
          game: {
            select: {
              id: true, slug: true, titleBg: true, titleEn: true,
              thumbnailUrl: true, imageUrl: true, bggRating: true,
            },
          },
        },
      },
    },
  })
}

// ── OG Metadata ────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { shareToken } = await params
  const top9 = await getTop9(shareToken)

  if (!top9 || !top9.isPublic) {
    return { title: 'Top 9 | MeeplesBG' }
  }

  const месец    = МЕСЕЦИ[top9.month - 1] ?? ''
  const userName = top9.user.bggUsername ?? top9.user.name ?? 'Потребител'
  const топ3     = top9.entries
    .slice(0, 3)
    .map((e) => e.game.titleBg)
    .join(', ')

  const title       = `${userName} — Top 9 за ${месец} ${top9.year}`
  const description = топ3
    ? `${топ3}... Виж любимите настолни игри за ${месец} ${top9.year} в MeeplesBG.`
    : `Разгледай Top 9 настолни игри за ${месец} ${top9.year} в MeeplesBG.`

  // Strip cache-bust query string from OG image URL so crawlers can cache it
  const ogImage = top9.generatedImageUrl
    ? top9.generatedImageUrl.split('?')[0]
    : null

  return {
    title:       `${title} | MeeplesBG`,
    description,
    openGraph: {
      title,
      description,
      type:   'website',
      locale: 'bg_BG',
      ...(ogImage && {
        images: [{ url: ogImage, width: 1080, height: 1080, alt: title }],
      }),
    },
    twitter: {
      card:        ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

// ── Страница ───────────────────────────────────────────────────

export default async function ПубличенTop9({ params }: { params: Params }) {
  const { shareToken } = await params
  const top9 = await getTop9(shareToken)

  if (!top9) notFound()

  // Private Top 9 — neutral message (don't reveal it exists)
  if (!top9.isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Този Top 9 е личен</h1>
          <p className="text-sm text-gray-500 mb-6">
            Собственикът е избрал да не го споделя публично.
          </p>
          <Link
            href="/"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Към MeeplesBG
          </Link>
        </div>
      </div>
    )
  }

  const месец    = МЕСЕЦИ[top9.month - 1] ?? ''
  const userName = top9.user.bggUsername ?? top9.user.name ?? 'Потребител'
  const publicProfileUrl = `/potrebiteli/${encodeURIComponent(top9.user.bggUsername ?? top9.user.id)}`

  const hdrs    = await headers()
  const host    = hdrs.get('host') ?? 'meeplesbg.com'
  const proto   = host.startsWith('localhost') ? 'http' : 'https'
  const shareUrl = `${proto}://${host}/top9/${shareToken}`

  // Build a position map for the 3×3 grid
  const slotMap = new Map(top9.entries.map((e) => [e.position, e]))

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {top9.user.image ? (
          <Image
            src={top9.user.image}
            alt={userName}
            width={56}
            height={56}
            className="rounded-full border-2 border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-xl font-bold text-brand-600 flex-shrink-0">
            {userName[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-0.5">
            <Link href={publicProfileUrl} className="hover:text-brand-600 transition-colors">
              {userName}
            </Link>
            {' '}споделя
          </p>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            Моят Top 9 — {месец} {top9.year}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {top9.entries.length} {top9.entries.length === 1 ? 'игра' : 'игри'}
          </p>
        </div>
      </div>

      {/* Generated share image */}
      {top9.generatedImageUrl && (
        <div className="mb-8 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={top9.generatedImageUrl}
            alt={`Top 9 — ${месец} ${top9.year}`}
            className="w-full"
          />
        </div>
      )}

      {/* 3×3 game grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((pos) => {
          const entry = slotMap.get(pos)

          if (!entry) {
            return (
              <div
                key={`empty-${pos}`}
                className="rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50 flex items-center justify-center text-gray-200"
                style={{ aspectRatio: '1 / 1' }}
              >
                <span className="text-2xl font-bold">{pos}</span>
              </div>
            )
          }

          return (
            <Link
              key={entry.id}
              href={`/igri/${entry.game.slug}`}
              className="relative rounded-2xl border border-gray-200 overflow-hidden group hover:border-brand-400 hover:shadow-md transition-all"
              style={{ aspectRatio: '1 / 1' }}
            >
              {/* Cover */}
              <div className="absolute inset-0">
                {entry.game.thumbnailUrl ? (
                  <Image
                    src={entry.game.thumbnailUrl}
                    alt={entry.game.titleBg}
                    fill
                    sizes="(max-width: 640px) 33vw, 200px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl bg-gray-100">
                    🎲
                  </div>
                )}
              </div>

              {/* Position badge */}
              <div className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center text-[11px] font-bold text-white">
                {pos}
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-2 pt-5 pb-2">
                <p className="text-white text-[10px] font-medium line-clamp-1">
                  {entry.game.titleBg}
                </p>
                {entry.playsCount && (
                  <p className="text-[10px] text-gold-400 mt-0.5">
                    {entry.playsCount}× партии
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Share buttons */}
      <div className="flex flex-wrap gap-2 mb-10">
        <CopyLinkButton url={shareUrl} />
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          📘 Сподели Facebook
        </a>
        <a
          href={`https://discord.com/channels/@me`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          title="Копирай линка и го постни в Discord"
        >
          🎮 Discord
        </a>
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-brand-50 border border-brand-100 p-6 text-center">
        <p className="text-2xl mb-2">🏆</p>
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Направи своя Top 9
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Запази любимите си настолни игри за всеки месец и ги сподели с приятели.
        </p>
        <Link
          href="/register"
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors inline-block"
        >
          Регистрирай се безплатно
        </Link>
      </div>
    </div>
  )
}

