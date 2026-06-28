import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import SessionProvider  from '@/components/ui/SessionProvider'
import CookieBanner     from '@/components/cookies/CookieBanner'
import GoogleAnalytics  from '@/components/analytics/GoogleAnalytics'

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
})

const САЙТ = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://meeplesbg.com'

export const metadata: Metadata = {
  metadataBase: new URL(САЙТ),
  title: {
    default: 'MeeplesBG — Настолни игри в България',
    template: '%s | MeeplesBG',
  },
  description:
    'Намерете, колекционирайте и обсъждайте настолни игри. Най-голямата база данни с настолни игри на български език.',
  keywords: ['настолни игри', 'board games', 'MeeplesBG', 'България', 'настолни игри онлайн'],
  openGraph: {
    siteName: 'MeeplesBG',
    locale:   'bg_BG',
    type:     'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

const уебСайтСхема = {
  '@context': 'https://schema.org',
  '@type':    'WebSite',
  name:        'MeeplesBG',
  url:         САЙТ,
  description: 'Най-голямата база данни с настолни игри на български език.',
  inLanguage:  'bg',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type':       'EntryPoint',
      urlTemplate:   `${САЙТ}/igri?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bg" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(уебСайтСхема) }}
        />
        <SessionProvider>{children}</SessionProvider>
        <CookieBanner />
        <GoogleAnalytics />
      </body>
    </html>
  )
}
