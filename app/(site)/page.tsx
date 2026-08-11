import { Suspense } from 'react'
import type { Metadata } from 'next'

import WeeklyGameHeroSection from '@/components/home/WeeklyGameHeroSection'
import NewReleasesSection   from '@/components/home/NewReleasesSection'
import NewsSection          from '@/components/home/NewsSection'
import BestsellersSection   from '@/components/home/BestsellersSection'
import DiscoverSection      from '@/components/home/DiscoverSection'
import NewsletterSection    from '@/components/home/NewsletterSection'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'MeeplesBG — Настолни игри на български',
  description:
    'Открий, играй и сподели любовта си към настолните игри. Над 2 000 игри с описания на български. Колекция, ревюта, форум и общност.',
  openGraph: {
    title: 'MeeplesBG — Настолни игри на български',
    description: 'Най-голямата онлайн общност за настолни игри в България.',
    locale: 'bg_BG',
    type: 'website',
  },
}

function НовиниСкелет() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-video bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function КартаРедСкелет() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-36 space-y-2">
              <div className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function КартиМрежаСкелет() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function НачалнаСтраница() {
  return (
    <>
      {/* 1. Hero — текуща Игра на седмицата */}
      <Suspense fallback={<div className="min-h-[400px] bg-brand-800 animate-pulse" />}>
        <WeeklyGameHeroSection />
      </Suspense>

      {/* 2. Нови в MeeplesBG */}
      <Suspense fallback={<КартаРедСкелет />}>
        <NewReleasesSection />
      </Suspense>

      {/* 3. Светът на настолните игри */}
      <Suspense fallback={<НовиниСкелет />}>
        <NewsSection />
      </Suspense>

      {/* 4. Топ класации */}
      <Suspense fallback={<КартиМрежаСкелет />}>
        <BestsellersSection />
      </Suspense>

      {/* 5. Открий игра */}
      <DiscoverSection />

      {/* 6. Бюлетин */}
      <NewsletterSection />
    </>
  )
}
