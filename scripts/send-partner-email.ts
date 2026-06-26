/**
 * Изпраща партньорски запитвания до онлайн магазини.
 *
 * Употреба:
 *   npx tsx --env-file=.env.local scripts/send-partner-email.ts
 *
 * За да добавите магазини, редактирайте масива МАГАЗИНИ по-долу.
 */

import { render } from '@react-email/components'
import { resend, ПАРТНЬОРСКИ_ИЗПРАЩАЧ, САЙТ_URL } from '../lib/resend'
import PartnerInquiryEmail from '../emails/PartnerInquiryEmail'

// ── Конфигурация ───────────────────────────────────────────────────────────────

const МАГАЗИНИ: Array<{
  shopName:     string
  contactName?: string
  shopUrl:      string
  toEmail:      string
}> = [
  // Добавете магазини тук, например:
  // {
  //   shopName:    'Zappak',
  //   contactName: 'Екип Zappak',
  //   shopUrl:     'https://zappak.bg',
  //   toEmail:     'contact@zappak.bg',
  // },
]

const ПАУЗА_МС = 1500 // пауза между имейлите (Resend rate limit: 2 req/s)

// ── Помощни функции ────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Основна функция ────────────────────────────────────────────────────────────

async function main() {
  if (МАГАЗИНИ.length === 0) {
    console.log('⚠️  Няма добавени магазини в масива МАГАЗИНИ.')
    console.log('   Редактирайте scripts/send-partner-email.ts и добавете поне един.')
    process.exit(0)
  }

  console.log(`📧 Изпращане до ${МАГАЗИНИ.length} магазин(а)...\n`)

  let успешни = 0
  let неуспешни = 0

  for (const магазин of МАГАЗИНИ) {
    const html = await render(
      PartnerInquiryEmail({
        shopName:    магазин.shopName,
        contactName: магазин.contactName,
        shopUrl:     магазин.shopUrl,
        siteUrl:     САЙТ_URL,
      })
    )

    const { data, error } = await resend.emails.send({
      from:    ПАРТНЬОРСКИ_ИЗПРАЩАЧ,
      to:      магазин.toEmail,
      subject: `Покана за партньорство — MeeplesBG × ${магазин.shopName}`,
      html,
    })

    if (error) {
      console.error(`❌ ${магазин.shopName} (${магазин.toEmail}): ${error.message}`)
      неуспешни++
    } else {
      console.log(`✅ ${магазин.shopName} (${магазин.toEmail}) — ID: ${data?.id}`)
      успешни++
    }

    if (магазин !== МАГАЗИНИ.at(-1)) {
      await sleep(ПАУЗА_МС)
    }
  }

  console.log(`\n── Резултат: ${успешни} успешни, ${неуспешни} неуспешни ──`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
