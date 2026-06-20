import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const rawPath = req.nextUrl.pathname
  let decodedPath = rawPath
  try {
    decodedPath = decodeURIComponent(rawPath)
  } catch {
    decodedPath = rawPath
  }

  // Redirect стари Cyrillic URL-и към ASCII еквиваленти
  if (decodedPath.startsWith('/игри')) {
    const rest = decodedPath.slice('/игри'.length)
    const redirectUrl = new URL(`/igri${rest}`, req.url)
    redirectUrl.search = req.nextUrl.search
    return NextResponse.redirect(redirectUrl, 301)
  }

  if (decodedPath === '/вход') {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.search = req.nextUrl.search
    return NextResponse.redirect(redirectUrl, 301)
  }

  if (decodedPath === '/регистрация') {
    const redirectUrl = new URL('/register', req.url)
    redirectUrl.search = req.nextUrl.search
    return NextResponse.redirect(redirectUrl, 301)
  }

  const { pathname } = req.nextUrl
  const влязъл = !!req.auth

  // Профил — изисква вход
  if (pathname.startsWith('/profil')) {
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
  matcher: ['/:path*'],
}
