import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { contactLimiter, newsletterLimiter, playsLimiter } from '@/lib/ratelimit'

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

async function applyRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl
  const method = req.method

  let limiter: typeof contactLimiter | null = null
  if (pathname === '/api/contact' && method === 'POST') limiter = contactLimiter
  else if (pathname === '/api/newsletter/subscribe' && method === 'POST') limiter = newsletterLimiter
  else if (pathname === '/api/plays' && method === 'POST') limiter = playsLimiter

  if (!limiter) return null

  const ip = getIP(req)
  const { success, limit, remaining, reset } = await limiter.limit(ip)

  if (!success) {
    return NextResponse.json(
      { error: 'Твърде много заявки. Опитай след малко.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit':     String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset':     String(reset),
          'Retry-After':           String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }

  return null
}

export default auth(async (req) => {
  // Rate limiting
  const rateLimitResponse = await applyRateLimit(req)
  if (rateLimitResponse) return rateLimitResponse

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

  // Admin панел и API — изисква ADMIN или MODERATOR роля
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!влязъл) {
      const url = new URL('/login', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    const role = req.auth?.user?.role
    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/:path*'],
}
