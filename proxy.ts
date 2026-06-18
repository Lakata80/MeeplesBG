import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  // Handle legacy percent-encoded or Cyrillic paths and redirect to ASCII routes
  const rawPath = req.nextUrl.pathname
  let decodedPath = rawPath
  try {
    decodedPath = decodeURIComponent(rawPath)
  } catch (e) {
    decodedPath = rawPath
  }

  if (decodedPath === '/вход') {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.search = req.nextUrl.search
    return NextResponse.redirect(redirectUrl)
  }

  if (decodedPath === '/регистрация') {
    const redirectUrl = new URL('/register', req.url)
    redirectUrl.search = req.nextUrl.search
    return NextResponse.redirect(redirectUrl)
  }

  const { pathname } = req.nextUrl
  const влязъл = !!req.auth

  // Профил и колекция — изисква вход
  if (
    pathname.startsWith('/профил') ||
    pathname.startsWith('/колекция')
  ) {
    if (!влязъл) {
      const url = new URL('/login', req.url)
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
      return NextResponse.redirect(new URL('/login', req.url))
    }
    if (req.auth?.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  // Run proxy for all paths so legacy percent-encoded Cyrillic requests are caught.
  // In production you can narrow this matcher to reduce overhead.
  matcher: ['/:path*'],
}
