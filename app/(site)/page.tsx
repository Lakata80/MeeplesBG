import { Suspense } from 'react'
import type { Metadata } from 'next'

import HeroSection      from '@/components/home/HeroSection'
import HotnessSection   from '@/components/home/HotnessSection'
import OccasionSection  from '@/components/home/OccasionSection'
import BestsellersSection from '@/components/home/BestsellersSection'
import NewsSection      from '@/components/home/NewsSection'
import MehanikiTeaser  from '@/components/home/MehanikiTeaser'

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

function СекцияСкелет({ височина = 'h-64' }: { височина?: string }) {
  return <div className={`${височина} bg-gray-100 animate-pulse`} />
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
              <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function НовиниСкелет() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="h-7 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-video bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function НачалнаСтраница() {
  return (
    <>
      {/* 1. Hero с квиз CTA */}
      <HeroSection />

      {/* 2. Популярни игри (BGG Hotness) */}
      <Suspense fallback={<СекцияСкелет височина="h-52" />}>
        <HotnessSection />
      </Suspense>

      {/* 3. Намери игра според случая */}
      <OccasionSection />

      {/* 4. Топ класации */}
      <Suspense fallback={<КартиМрежаСкелет />}>
        <BestsellersSection />
      </Suspense>

      {/* 5. Механики тийзър */}
      <MehanikiTeaser />

      {/* 6. Статии */}
      <Suspense fallback={<НовиниСкелет />}>
        <NewsSection />
      </Suspense>
    </>
  )
}
