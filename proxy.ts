import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const влязъл = !!req.auth

  // Профил и колекция — изисква вход
  if (
    pathname.startsWith('/профил') ||
    pathname.startsWith('/колекция')
  ) {
    if (!влязъл) {
      const url = new URL('/вход', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Admin панел и API — изисква ADMIN роля
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin')
  ) {
    if (!влязъл) {
      return NextResponse.redirect(new URL('/вход', req.url))
    }
    if (req.auth?.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/профил/:path*',
    '/колекция/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
}
