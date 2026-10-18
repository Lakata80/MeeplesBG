/**
 * Еднократен скрипт: добавя корична снимка за Rebirth II (bggId=480901)
 * Снимката се взема директно от BGG, конвертира се в WebP и се качва в R2.
 *
 * Употреба:
 *   npx tsx --env-file=.env --env-file=.env.local scripts/patch-rebirth-ii-image.ts
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'

const BGG_ID = 480901

const prisma = new PrismaClient()

async function main() {
  const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
  const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!
  const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!
  const BUCKET     = process.env.R2_BUCKET_NAME!
  const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  const TOKEN      = process.env.BGG_API_TOKEN ?? ''
  const COOKIE     = process.env.BGG_SESSION_COOKIE ?? ''

  const s3 = new S3Client({
    region:   'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  })

  // Вземи BGG image URL
  console.log(`🔍  Взимам image URL от BGG за bggId=${BGG_ID}...`)
  const xml = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${BGG_ID}`, {
    headers: {
      'User-Agent': 'MeeplesBG/1.0',
      ...(TOKEN  ? { 'Authorization': `Bearer ${TOKEN}` }  : {}),
      ...(COOKIE ? { 'Cookie': COOKIE }                    : {}),
    }
  }).then(r => r.text())

  const match = xml.match(/<image>([^<]+)<\/image>/)
  if (!match) throw new Error('Не намерих image URL в BGG XML')

  const bggImageUrl = match[1].startsWith('//') ? `https:${match[1]}` : match[1]
  console.log('📎  BGG image URL:', bggImageUrl)

  // Свали и конвертирай в WebP
  console.log('⬇️   Сваляне на снимката...')
  const res = await fetch(bggImageUrl, {
    headers: {
      'User-Agent': 'MeeplesBG/1.0',
      ...(COOKIE ? { 'Cookie': COOKIE } : {}),
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} при сваляне`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const webp   = await sharp(buffer).webp({ quality: 85 }).toBuffer()

  // Качи в R2
  const ключ = `games/${BGG_ID}.webp`
  console.log(`☁️   Качване в R2: ${ключ}...`)
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: ключ, Body: webp,
    ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable',
  }))

  // Обнови imageUrl в базата
  const url = `${PUBLIC_URL}/${ключ}`
  await prisma.game.update({ where: { bggId: BGG_ID }, data: { imageUrl: url } })
  console.log('✓ Снимката е записана:', url)
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
