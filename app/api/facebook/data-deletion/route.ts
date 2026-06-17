import crypto from 'crypto'
import { NextResponse } from 'next/server'

// Facebook изпраща signed_request като application/x-www-form-urlencoded с поле signed_request
// Този рут валидира подписа и връща JSON с { url, confirmation_code } според изискванията.

function base64UrlToBuffer(str: string) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Buffer.from(str, 'base64')
}

export async function POST(req: Request) {
  const body = await req.text()
  const params = new URLSearchParams(body)
  const signed = params.get('signed_request')
  if (!signed) return new NextResponse('signed_request липсва', { status: 400 })

  const parts = signed.split('.')
  if (parts.length !== 2) return new NextResponse('Невалиден signed_request', { status: 400 })
  const sig = parts[0]
  const payloadB64 = parts[1]

  try {
    const sigBuf = base64UrlToBuffer(sig)
    const expected = crypto.createHmac('sha256', process.env.FACEBOOK_CLIENT_SECRET || process.env.FACEBOOK_APP_SECRET || '')
      .update(payloadB64)
      .digest()

    if (sigBuf.length !== expected.length || !crypto.timingSafeEqual(sigBuf, expected)) {
      return new NextResponse('Невалиден подпис', { status: 400 })
    }

    const payloadJson = base64UrlToBuffer(payloadB64).toString('utf8')
    const payload = JSON.parse(payloadJson)

    // payload съдържа user_id и timestamp. Пример: { user_id: '123', algorithm: 'HMAC-SHA256' }
    const fbUserId = payload.user_id || payload['user_id']
    if (!fbUserId) return new NextResponse('user_id липсва в payload', { status: 400 })

    // TODO: заменете с реална логика за изтриване от вашата база данни (Prisma/pg и т.н.)
    // Пример (psевдо): await db.user.delete({ where: { facebookId: fbUserId } })

    // За демонстрация: генерираме confirmation_code и връщаме URL към страница за потвърждение
    const confirmationCode = crypto.randomBytes(16).toString('hex')
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.example'
    const confirmationUrl = `${baseUrl}/legal/data-deletion-confirmation?confirmation_code=${confirmationCode}`

    // В реална имплементация: маркирайте потребителя за изтриване, премахнете свързани данни и запазете confirmation_code в лог.

    return NextResponse.json({ url: confirmationUrl, confirmation_code: confirmationCode })
  } catch (err) {
    console.error('data-deletion error', err)
    return new NextResponse('Грешка при обработка', { status: 500 })
  }
}
