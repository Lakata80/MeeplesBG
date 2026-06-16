import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '@/components/ui/SessionProvider'
import CookieBanner    from '@/components/cookies/CookieBanner'

const САЙТ = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://meeplebg.com'

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
      urlTemplate:   `${САЙТ}/игри?q={search_term_string}`,
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
    <html lang="bg">
      <body className="antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(уебСайтСхема) }}
        />
        <SessionProvider>{children}</SessionProvider>
        <CookieBanner />
      </body>
    </html>
  )
}
