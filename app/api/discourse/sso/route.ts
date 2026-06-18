import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse }  from 'next/server'
import { auth }                       from '@/auth'

// SSO endpoint за Discourse ─────────────────────────────────────
// Discourse изпраща потребителя тук с ?sso=BASE64_PAYLOAD&sig=HMAC_SIG
// Ние верифицираме подписа, вземаме сесията и пренасочваме обратно.

export const dynamic = 'force-dynamic'

// ── Криптографски помощни функции ────────────────────────────

function hmacHex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

function verifyHmac(secret: string, payload: string, received: string): boolean {
  // SHA256 hex е винаги 64 символа; отхвърляме невалиден формат веднага
  if (!/^[0-9a-f]{64}$/i.test(received)) return false
  const expected    = Buffer.from(hmacHex(secret, payload), 'hex')
  const receivedBuf = Buffer.from(received.toLowerCase(),   'hex')
  return timingSafeEqual(expected, receivedBuf)
}

// ── Генериране на Discourse-съвместимо потребителско име ─────

function извлечиUsername(user: {
  name?:        string | null
  email?:       string | null
  bggUsername?: string | null
  id:           string
}): string {
  const raw =
    user.bggUsername ||
    user.name ||
    user.email?.split('@')[0] ||
    user.id.slice(0, 12)

  const clean = raw
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, '_')   // само валидни символи
    .replace(/^[_.]+|[_.]+$/g, '')   // без водещи/крайни специални
    .replace(/_{2,}/g,          '_') // без двойни долни черти
    .slice(0, 20)                    // максимум 20 знака

  return clean.length >= 3 ? clean : `user_${user.id.slice(0, 8)}`
}

// ── GET handler ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const SECRET        = process.env.DISCOURSE_SSO_SECRET
  const DISCOURSE_URL = process.env.DISCOURSE_URL

  if (!SECRET || !DISCOURSE_URL) {
    return new Response(
      'Discourse SSO не е конфигурирано. Задайте DISCOURSE_SSO_SECRET и DISCOURSE_URL.',
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const sso = searchParams.get('sso')
  const sig = searchParams.get('sig')

  // 1. Проверка на задължителни параметри
  if (!sso || !sig) {
    return new Response(
      'Липсват задължителни параметри: sso, sig.',
      { status: 400 },
    )
  }

  // 2. Верификация на HMAC подписа — предпазва от фалшиви заявки
  if (!verifyHmac(SECRET, sso, sig)) {
    return new Response(
      'Невалиден подпис. Заявката е отхвърлена.',
      { status: 403 },
    )
  }

  // 3. Декодирай SSO payload
  let nonce:        string | null
  let returnSsoUrl: string | null

  try {
    const decoded  = Buffer.from(sso, 'base64').toString('utf-8')
    const payload  = new URLSearchParams(decoded)
    nonce          = payload.get('nonce')
    returnSsoUrl   = payload.get('return_sso_url')
  } catch {
    return new Response('Невалиден SSO payload.', { status: 400 })
  }

  if (!nonce || !returnSsoUrl) {
    return new Response('Липсват nonce или return_sso_url в payload.', { status: 400 })
  }

  // 4. Сигурностна проверка — return_sso_url трябва да е от нашия Discourse
  if (!returnSsoUrl.startsWith(DISCOURSE_URL)) {
    return new Response('Невалиден return_sso_url.', { status: 403 })
  }

  // 5. Провери сесията на потребителя
  const session = await auth()

  if (!session?.user?.id) {
    // Не е влязъл — пренасочи към страницата за вход
    // След успешен вход ще бъде върнат тук за да продължи SSO потока
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const потребител = session.user

  // 6. Изгради отговора за Discourse
  const username = извлечиUsername({
    name:        потребител.name,
    email:       потребител.email,
    bggUsername: (потребител as { bggUsername?: string }).bggUsername,
    id:          потребител.id,
  })

  const responseParams = new URLSearchParams({
    nonce,
    external_id: потребител.id,
    email:       потребител.email ?? '',
    username,
    name:        потребител.name ?? username,
  })

  if (потребител.image) {
    responseParams.set('avatar_url',          потребител.image)
    responseParams.set('avatar_force_update', 'false')
  }

  // 7. Подпиши отговора
  const responsePayload = Buffer.from(responseParams.toString()).toString('base64')
  const responseSig     = hmacHex(SECRET, responsePayload)

  // 8. Пренасочи обратно към Discourse
  const redirectUrl = new URL(returnSsoUrl)
  redirectUrl.searchParams.set('sso', responsePayload)
  redirectUrl.searchParams.set('sig', responseSig)

  return NextResponse.redirect(redirectUrl.toString())
}
