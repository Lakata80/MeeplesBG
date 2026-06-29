import type { NextRequest } from 'next/server'
import { resend, ИЗПРАЩАЧ } from '@/lib/resend'

const ПОЛУЧАТЕЛ = 'contact@meeplesbg.com'

const ТЕМИ: Record<string, string> = {
  въпрос:        'Общ въпрос',
  грешка:        'Докладване на грешка',
  партньор:      'Партньорство / Реклама',
  игра:          'Добавяне / корекция на игра',
  поверителност: 'Поверителност и GDPR',
  друго:         'Друго',
}

// Rate limiting се обработва от middleware.ts чрез Upstash Redis (contactLimiter)

export async function POST(req: NextRequest) {
  let тяло: { тема?: string; съобщение?: string; email?: string }

  try {
    тяло = await req.json() as typeof тяло
  } catch {
    return Response.json({ грешка: 'Невалидно тяло на заявката.' }, { status: 400 })
  }

  const { тема, съобщение, email } = тяло

  if (!тема || !ТЕМИ[тема]) {
    return Response.json({ грешка: 'Изберете валидна тема.' }, { status: 422 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ грешка: 'Невалиден имейл адрес.' }, { status: 422 })
  }
  if (!съобщение || съобщение.trim().length < 10) {
    return Response.json({ грешка: 'Съобщението трябва да е поне 10 символа.' }, { status: 422 })
  }
  if (съобщение.trim().length > 5000) {
    return Response.json({ грешка: 'Съобщението не може да надвишава 5000 символа.' }, { status: 422 })
  }

  const темаЕтикет = ТЕМИ[тема]
  const emailЧист  = email.trim()
  const текст      = съобщение.trim()

  try {
    await resend.emails.send({
      from:    ИЗПРАЩАЧ,
      to:      ПОЛУЧАТЕЛ,
      replyTo: emailЧист,
      subject: `[Контакт] ${темаЕтикет} — ${emailЧист}`,
      text: `Тема: ${темаЕтикет}\nОт: ${emailЧист}\n\n${текст}`,
      html: `
        <h2 style="font-family:sans-serif;color:#111827">Ново съобщение от контактната форма</h2>
        <table style="font-family:sans-serif;font-size:14px;color:#374151;border-collapse:collapse;width:100%">
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;font-weight:600;width:120px">Тема</td>
            <td style="padding:8px 12px;border-left:3px solid #2563eb">${темаЕтикет}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;font-weight:600">Имейл</td>
            <td style="padding:8px 12px;border-left:3px solid #2563eb">${emailЧист}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#f9fafb;font-weight:600;vertical-align:top">Съобщение</td>
            <td style="padding:8px 12px;border-left:3px solid #2563eb;white-space:pre-wrap">${текст.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          </tr>
        </table>
      `,
    })
  } catch (err) {
    console.error('Грешка при изпращане на контактен имейл:', err)
    return Response.json(
      { грешка: 'Грешка при изпращане. Моля, опитайте отново или пишете директно на contact@meeplesbg.com.' },
      { status: 502 },
    )
  }

  // Потвърдително имейл до подателя (некритично)
  await resend.emails.send({
    from:    ИЗПРАЩАЧ,
    to:      emailЧист,
    subject: 'Получихме вашето съобщение — MeeplesBG',
    text:    `Здравейте,\n\nПолучихме вашето съобщение по темата „${темаЕтикет}".\nЩе ви отговорим в срок до 2 работни дни.\n\nС уважение,\nЕкипът на MeeplesBG`,
    html: `
      <p style="font-family:sans-serif;color:#374151">Здравейте,</p>
      <p style="font-family:sans-serif;color:#374151">Получихме вашето съобщение по темата <strong>${темаЕтикет}</strong>.</p>
      <p style="font-family:sans-serif;color:#374151">Ще ви отговорим в срок до <strong>2 работни дни</strong>.</p>
      <p style="font-family:sans-serif;color:#374151">С уважение,<br><strong>Екипът на MeeplesBG</strong></p>
    `,
  }).catch(() => { /* Потвърдителният имейл не е критичен */ })

  return Response.json(
    { успех: true, съобщение: 'Съобщението беше изпратено успешно. Ще ви отговорим скоро!' },
    { status: 200 },
  )
}
