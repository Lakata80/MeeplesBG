/**
 * Еднократен скрипт: добавя снимки и благодарности към статията за Guldbrikken 2026
 *
 * Употреба:
 *   npx tsx --env-file=.env --env-file=.env.local scripts/patch-guldbrikken-photos.ts
 */

import { createClient } from '@sanity/client'
import * as fs          from 'fs'
import * as path        from 'path'
import * as crypto      from 'crypto'

// ─── Конфигурация ─────────────────────────────────────────────────

const DOC_SLUG  = 'guldbrikken-2026-nominacii'
const DOC_DRAFT_ID = 'drafts.guldbrikken-2026'

const IMAGES_DIR = 'C:\\Users\\maria\\Downloads'

const IMAGES: { filename: string; alt: string; caption: string }[] = [
  {
    filename: 'guldbrikken2025award-279.jpg',
    alt:      'Церемония по награждаването на Guldbrikken',
    caption:  'Снимка: Guldbrikken Organisation',
  },
  {
    filename: 'guldbrikken2025award-324.jpg',
    alt:      'Номинирани на наградата Guldbrikken',
    caption:  'Снимка: Guldbrikken Organisation',
  },
  {
    filename: 'guldbrikken2025award-360.jpg',
    alt:      'Журито на Guldbrikken',
    caption:  'Снимка: Guldbrikken Organisation',
  },
  {
    filename: 'guldbrikken2025award-409.jpg',
    alt:      'Победители в Guldbrikken',
    caption:  'Снимка: Guldbrikken Organisation',
  },
]

// ─── Sanity write клиент ──────────────────────────────────────────

function sanityWriteClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID не е зададен')
  const token = process.env.SANITY_API_TOKEN
  if (!token) throw new Error('SANITY_API_TOKEN не е зададен')
  return createClient({
    projectId,
    dataset:    process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: '2024-01-01',
    token,
    useCdn:     false,
  })
}

// ─── Уникален ключ за PortableText ───────────────────────────────

const rk = () => crypto.randomBytes(5).toString('hex')

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const client = sanityWriteClient()

  // 1. Намери документа
  console.log(`\n🔍  Търсене на документ: ${DOC_DRAFT_ID}`)
  let doc = await client.fetch(`*[_id == $id][0]`, { id: DOC_DRAFT_ID })

  if (!doc) {
    console.log('⚠️   Draft ID не намерен — търсим по slug с previewDrafts...')
    doc = await client.fetch(
      `*[_type == "post" && slug.current == $slug][0]`,
      { slug: DOC_SLUG },
      { perspective: 'previewDrafts' } as Parameters<typeof client.fetch>[2],
    )
  }

  if (!doc) {
    throw new Error(`Статията "${DOC_SLUG}" не е намерена в Sanity`)
  }
  console.log(`✅  Намерена: "${doc.title}"  (_id: ${doc._id})`)

  // 2. Качи 4-те снимки в Sanity asset store
  console.log('\n📤  Качване на снимки...')
  const uploadedAssets: { _type: string; _key: string; asset: { _type: string; _ref: string }; alt: string; caption: string; hotspot: { x: number; y: number; height: number; width: number } }[] = []

  for (const img of IMAGES) {
    const filePath = path.join(IMAGES_DIR, img.filename)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Файлът не е намерен: ${filePath}`)
    }
    const buffer = fs.readFileSync(filePath)
    const asset  = await client.assets.upload('image', buffer, {
      filename:    img.filename,
      contentType: 'image/jpeg',
    })
    console.log(`  ✔  ${img.filename}  →  ${asset._id}`)
    uploadedAssets.push({
      _type:   'image',
      _key:    rk(),
      asset:   { _type: 'reference', _ref: asset._id },
      alt:     img.alt,
      caption: img.caption,
      hotspot: { x: 0.5, y: 0.5, height: 1, width: 1 },
    })
  }

  // 3. Нови блокове: h2 заглавие, 4 снимки, благодарности
  const galleryHeading = {
    _type:    'block',
    _key:     rk(),
    style:    'h2',
    children: [{ _type: 'span', _key: rk(), text: 'Снимки от наградата', marks: [] }],
    markDefs: [],
  }

  const thanksBlock = {
    _type:    'block',
    _key:     rk(),
    style:    'normal',
    children: [
      {
        _type: 'span',
        _key:  rk(),
        text:  'Изказваме специални благодарности на екипа на ',
        marks: [],
      },
      {
        _type: 'span',
        _key:  rk(),
        text:  'Guldbrikken Organisation',
        marks: ['strong'],
      },
      {
        _type: 'span',
        _key:  rk(),
        text:  ' за любезно предоставените снимки и правото за публикуването им. Авторски права: Guldbrikken Organisation.',
        marks: [],
      },
    ],
    markDefs: [],
  }

  const newBlocks = [galleryHeading, ...uploadedAssets, thanksBlock]

  // 4. Patch на draft документа
  const targetId = doc._id.startsWith('drafts.') ? doc._id : `drafts.${doc._id}`
  console.log(`\n📝  Patch на ${targetId}...`)

  const existingBody: unknown[] = Array.isArray(doc.body) ? doc.body : []
  await client
    .patch(targetId)
    .set({ body: [...existingBody, ...newBlocks] })
    .commit()

  console.log('\n' + '═'.repeat(60))
  console.log('✅  Статията е обновена успешно!')
  console.log(`📌  Sanity ID:   ${targetId}`)
  console.log(`🌐  Studio URL:  https://www.meeplesbg.com/studio`)
  console.log('⚠️   Статията е все още draft — НЕ е публикувана.')
  console.log('═'.repeat(60) + '\n')
}

main().catch(err => {
  console.error('❌  Грешка:', (err as Error).message)
  process.exit(1)
})
