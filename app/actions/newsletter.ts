'use server'

import { prisma }                    from '@/lib/prisma'
import { resend, ИЗПРАЩАЧ, САЙТ_URL } from '@/lib/resend'
import WelcomeEmail                  from '@/emails/WelcomeEmail'

type НюзлетърСтатус =
  | { успех: true; съобщение: string }
  | { успех: false; грешка: string }
  | undefined

export async function абонирай(
  _prev: НюзлетърСтатус,
  formData: FormData
): Promise<НюзлетърСтатус> {
  const email = (formData.get('email') as string | null)?.trim().toLowerCase()

  if (!email) {
    return { успех: false, грешка: 'Моля, въведи имейл адрес.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { успех: false, грешка: 'Невалиден имейл адрес.' }
  }

  try {
    const съществуващ = await prisma.newsletterSubscriber.findUnique({
      where:  { email },
      select: { isActive: true },
    })

    if (съществуващ?.isActive) {
      return { успех: false, грешка: 'Имейлът вече е абониран за нашия бюлетин.' }
    }

    const абонат = await prisma.newsletterSubscriber.upsert({
      where:  { email },
      update: { isActive: true },
      create: { email },
      select: { email: true, unsubscribeToken: true },
    })

    const unsubscribeUrl = `${САЙТ_URL}/api/newsletter/unsubscribe?token=${абонат.unsubscribeToken}`

    await resend.emails.send({
      from:    ИЗПРАЩАЧ,
      to:      абонат.email,
      subject: 'Добре дошъл в MeeplesBG бюлетина! 🎲',
      react:   WelcomeEmail({ email: абонат.email, unsubscribeUrl, siteUrl: САЙТ_URL }),
    }).catch((err: unknown) => {
      console.error('Грешка при изпращане на welcome имейл:', err)
    })

    return { успех: true, съобщение: 'Абонирахте се успешно! Провери имейла си.' }
  } catch {
    return { успех: false, грешка: 'Възникна грешка. Моля, опитай отново.' }
  }
}
