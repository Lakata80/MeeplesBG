import crypto      from 'crypto'
import { NextResponse } from 'next/server'
import { prisma }  from '@/lib/prisma'

function base64UrlToBuffer(str: string) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Buffer.from(str, 'base64')
}

export async function POST(req: Request) {
  const body   = await req.text()
  const params = new URLSearchParams(body)
  const signed = params.get('signed_request')

  if (!signed) return new NextResponse('signed_request липсва', { status: 400 })

  const parts = signed.split('.')
  if (parts.length !== 2) return new NextResponse('Невалиден signed_request', { status: 400 })

  const [sig, payloadB64] = parts

  try {
    // ── Валидиране на подписа ─────────────────────────────────
    const sigBuf   = base64UrlToBuffer(sig)
    const expected = crypto
      .createHmac('sha256', process.env.FACEBOOK_CLIENT_SECRET ?? '')
      .update(payloadB64)
      .digest()

    if (sigBuf.length !== expected.length || !crypto.timingSafeEqual(sigBuf, expected)) {
      return new NextResponse('Невалиден подпис', { status: 403 })
    }

    const payload  = JSON.parse(base64UrlToBuffer(payloadB64).toString('utf8'))
    const fbUserId = payload.user_id as string | undefined

    if (!fbUserId) return new NextResponse('user_id липсва в payload', { status: 400 })

    // ── Намери потребителя по Facebook акаунт ─────────────────
    const account = await prisma.account.findFirst({
      where:  { provider: 'facebook', providerAccountId: fbUserId },
      select: { userId: true },
    })

    if (account) {
      const userId = account.userId

      await prisma.$transaction(async (tx) => {
        // Изтрий отговорите на потребителя в чужди теми
        await tx.threadReply.deleteMany({ where: { authorId: userId } })

        // Изтрий темите на потребителя (cascade → техните отговори)
        await tx.thread.deleteMany({ where: { authorId: userId } })

        // Изтрий блог статиите на потребителя (ако има)
        await tx.blogPost.deleteMany({ where: { authorId: userId } })

        // Изтрий потребителя — cascade покрива:
        // Account, Session, UserCollection, Review, Comment,
        // BlogComment, PendingImage, Notification, MonthlyTop9
        await tx.user.delete({ where: { id: userId } })
      })
    }
    // Ако акаунтът не е намерен — вече е изтрит; връщаме успех без грешка

    // ── Отговор към Facebook ──────────────────────────────────
    const confirmationCode = crypto.randomBytes(16).toString('hex')
    const baseUrl          = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://meeplesbg.com'
    const confirmationUrl  = `${baseUrl}/legal/data-deletion-confirmation?confirmation_code=${confirmationCode}`

    return NextResponse.json({ url: confirmationUrl, confirmation_code: confirmationCode })

  } catch (err) {
    console.error('[facebook/data-deletion]', err)
    return new NextResponse('Грешка при обработка', { status: 500 })
  }
}
