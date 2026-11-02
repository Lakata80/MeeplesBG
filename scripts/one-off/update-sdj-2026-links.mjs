/**
 * Обновява статията за SdJ 2026:
 *  - Добавя линкове към /igri/[slug] в H3 заглавията на игрите
 *  - Качва снимката на Rebirth от нашия CDN като mainImage
 *
 * node --env-file=.env.local scripts/update-sdj-2026-links.mjs
 */

import { createClient } from '@sanity/client'

const DOC_ID = 'ZEQ9C1K5qvFb7hKWmvFxgC'

// Само игрите, открити в нашата база данни
const GAME_LINKS = {
  'JinxO (Dito!)':        '/igri/jinxo',
  'Cozy Stickerville':    '/igri/cozy-stickerville',
  'Rebirth':              '/igri/rebirth',
  'Boss Fighters QR':     '/igri/boss-fighters-qr',
  'Moon Colony Bloodbath':'/igri/moon-colony-bloodbath',
  'Mooki Island':         '/igri/mooki-island',
}

// Главна снимка — Rebirth (от нашия CDN, Kennerspiel победител с историческото трио на Knizia)
const COVER_IMAGE_URL = 'https://images.meeplesbg.com/games/417197.webp'

const token = process.env.SANITY_API_TOKEN
if (!token) {
  console.error('❌  Липсва SANITY_API_TOKEN.')
  process.exit(1)
}

const client = createClient({
  projectId:  'egcewon8',
  dataset:    'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

async function main() {
  // ── 1. Вземи текущото тяло на статията ───────────────────────────────────
  const doc = await client.fetch(
    `*[_id == $id][0]{ body, mainImage }`,
    { id: DOC_ID }
  )
  if (!doc) { console.error('❌  Документът не е намерен.'); process.exit(1) }

  // ── 2. Добави линкове в H3 блоковете ─────────────────────────────────────
  let linked = 0
  const updatedBody = doc.body.map(block => {
    if (block._type !== 'block' || block.style !== 'h3') return block

    const fullText = block.children.map(c => c.text ?? '').join('')
    const href = GAME_LINKS[fullText]
    if (!href) return block   // игра без страница на сайта → оставяме без линк

    const linkKey = `lnk_${block._key}`
    linked++
    return {
      ...block,
      markDefs: [{ _type: 'link', _key: linkKey, href, blank: false }],
      children: block.children.map(child => ({
        ...child,
        marks: [...(child.marks ?? []), linkKey],
      })),
    }
  })

  console.log(`🔗  Добавени линкове: ${linked} заглавия`)

  // ── 3. Качи главна снимка в Sanity assets ────────────────────────────────
  console.log(`🖼   Изтеглям снимка: ${COVER_IMAGE_URL}`)
  const res    = await fetch(COVER_IMAGE_URL)
  const buffer = Buffer.from(await res.arrayBuffer())
  const asset  = await client.assets.upload('image', buffer, {
    filename:    'rebirth-kennerspiel-2026.webp',
    contentType: 'image/webp',
  })
  console.log(`✅  Снимката е качена → ${asset._id}`)

  // ── 4. Запиши промените ───────────────────────────────────────────────────
  await client
    .patch(DOC_ID)
    .set({
      body:      updatedBody,
      mainImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
        alt:   'Rebirth – Kennerspiel des Jahres 2026 победител (Reiner Knizia / Mighty Boards)',
      },
    })
    .commit()

  console.log('✅  Статията е обновена!')
  console.log('   Линковете и снимката са активни. Ако искаш друга снимка — смени mainImage в Studio.')
}

main().catch(err => {
  console.error('❌  Грешка:', err.message)
  process.exit(1)
})
