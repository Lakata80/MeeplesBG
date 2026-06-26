import type { NextRequest } from 'next/server'
import { render }          from '@react-email/components'
import { prisma }          from '@/lib/prisma'
import { resend, ИЗПРАЩАЧ, САЙТ_URL } from '@/lib/resend'
import WelcomeEmail        from '@/emails/WelcomeEmail'

// Rate limiting: max 3 абонамента / час на IP
// В serverless стейтът е per-instance; ъпгрейдни до Redis за production.
const ipCache  = new Map<string, { count: number; resetAt: number }>()
const ЛИМИТ    = 3
const ПРОЗОРЕЦ = 60 * 60_000

function проверкаЛимит(ip: string): boolean {
  const сега  = Date.now()
  const запис = ipCache.get(ip)
  if (!запис || сега > запис.resetAt) {
    ipCache.set(ip, { count: 1, resetAt: сега + ПРОЗОРЕЦ })
    return true
  }
  if (запис.count >= ЛИМИТ) return false
  запис.count++
  return true
}

// POST /api/newsletter/subscribe
// Body: { email: string }
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!проверкаЛимит(ip)) {
    return Response.json(
      { грешка: 'Твърде много заявки. Опитай след час.' },
      { status: 429 },
    )
  }

  let email: string | undefined

  try {
    const тяло = await req.json()
    email = typeof тяло.email === 'string' ? тяло.email.trim().toLowerCase() : undefined
  } catch {
    return Response.json({ грешка: 'Невалидно тяло на заявката.' }, { status: 400 })
  }

  if (!email) {
    return Response.json({ грешка: 'Полето "email" е задължително.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ грешка: 'Невалиден имейл адрес.' }, { status: 422 })
  }

  // Провери дали вече е абониран
  const съществуващ = await prisma.newsletterSubscriber.findUnique({
    where:  { email },
    select: { id: true, isActive: true, unsubscribeToken: true },
  })

  if (съществуващ?.isActive) {
    return Response.json(
      { грешка: 'Имейлът вече е абониран за нашия бюлетин.' },
      { status: 409 },
    )
  }

  // Създай или реактивирай абонамент
  const абонат = съществуващ
    ? await prisma.newsletterSubscriber.update({
        where:  { id: съществуващ.id },
        data:   { isActive: true },
        select: { email: true, unsubscribeToken: true },
      })
    : await prisma.newsletterSubscriber.create({
        data:   { email },
        select: { email: true, unsubscribeToken: true },
      })

  // Изпрати welcome имейл (грешка тук не блокира успешния отговор)
  const unsubscribeUrl = `${САЙТ_URL}/api/newsletter/unsubscribe?token=${абонат.unsubscribeToken}`
  const html = await render(WelcomeEmail({ email: абонат.email, unsubscribeUrl, siteUrl: САЙТ_URL }))

  await resend.emails.send({
    from:    ИЗПРАЩАЧ,
    to:      абонат.email,
    subject: 'Добре дошъл в MeeplesBG бюлетина! 🎲',
    html,
  }).catch((err: unknown) => {
    console.error('Грешка при изпращане на welcome имейл:', err)
  })

  return Response.json(
    { успех: true, съобщение: 'Абонирахте се успешно! Провери имейла си.' },
    { status: 200 },
  )
}
