import NextAuth          from 'next-auth'
import { NextResponse }  from 'next/server'
import type { NextRequest } from 'next/server'
import { authConfig }    from './auth.config'
import { contactLimiter, newsletterLimiter, playsLimiter } from './lib/ratelimit'

const { auth } = NextAuth(authConfig)

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const { pathname, method } = { pathname: req.nextUrl.pathname, method: req.method }
  const ip = getIP(req)

  let limiter: typeof contactLimiter | null = null

  if (pathname === '/api/contact' && method === 'POST') {
    limiter = contactLimiter
  } else if (pathname === '/api/newsletter/subscribe' && method === 'POST') {
    limiter = newsletterLimiter
  } else if (pathname === '/api/plays' && method === 'POST') {
    limiter = playsLimiter
  }

  if (!limiter) return null

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
  const rateLimitResponse = await rateLimitMiddleware(req)
  if (rateLimitResponse) return rateLimitResponse

  // Admin защита
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!req.auth) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`, req.nextUrl)
      )
    }
    const role = req.auth.user?.role
    if (role !== 'ADMIN' && role !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/', req.nextUrl))
    }
  }
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/contact',
    '/api/newsletter/subscribe',
    '/api/plays',
  ],
}
