import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '@/components/ui/SessionProvider'

export const metadata: Metadata = {
  title: {
    default: 'MeeplesBG — Настолни игри в България',
    template: '%s | MeeplesBG',
  },
  description:
    'Намерете, колекционирайте и обсъждайте настолни игри. Най-голямата база данни с настолни игри на български език.',
  keywords: ['настолни игри', 'board games', 'MeeplesBG', 'България'],
  openGraph: {
    siteName: 'MeeplesBG',
    locale: 'bg_BG',
    type: 'website',
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
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
