/**
 * Възстановява оригиналната BGG снимка за Aeon Trespass: Odyssey (bggId=242705).
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'

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
  const xml = await fetch('https://boardgamegeek.com/xmlapi2/thing?id=242705', {
    headers: {
      'User-Agent': 'MeeplesBG/1.0',
      ...(TOKEN  ? { 'Authorization': `Bearer ${TOKEN}` }  : {}),
      ...(COOKIE ? { 'Cookie': COOKIE }                    : {}),
    }
  }).then(r => r.text())

  const match = xml.match(/<image>([^<]+)<\/image>/)
  if (!match) throw new Error('Не намерих image URL в BGG XML')

  const bggImageUrl = match[1].startsWith('//') ? `https:${match[1]}` : match[1]
  console.log('BGG image URL:', bggImageUrl)

  // Свали и конвертирай
  const res = await fetch(bggImageUrl, {
    headers: {
      'User-Agent': 'MeeplesBG/1.0',
      ...(COOKIE ? { 'Cookie': COOKIE } : {}),
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} при сваляне`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const webp   = await sharp(buffer).webp({ quality: 85 }).toBuffer()

  // Качи обратно на оригиналния ключ
  const ключ = 'games/242705.webp'
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: ключ, Body: webp,
    ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable',
  }))

  // Обнови imageUrl в базата
  const url = `${PUBLIC_URL}/${ключ}`
  await prisma.game.update({ where: { slug: 'aeon-trespass-odyssey' }, data: { imageUrl: url } })
  console.log('✓ Оригиналната снимка е възстановена:', url)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
