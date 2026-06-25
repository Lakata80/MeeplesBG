import type { NextRequest } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { auth } from '@/auth'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_WIDTH = 1200
const MAX_IMAGES = 3

function r2Client() {
  return new S3Client({
    region:   'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  const index = parseInt(request.nextUrl.searchParams.get('index') ?? '0', 10)
  if (index < 0 || index >= MAX_IMAGES) {
    return Response.json({ грешка: 'Невалиден индекс.' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ грешка: 'Невалидни данни.' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return Response.json({ грешка: 'Липсва файл.' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return Response.json({ грешка: 'Само снимки (JPG, PNG, WebP).' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ грешка: 'Максимален размер: 5MB.' }, { status: 400 })
  }

  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const webp   = await sharp(buffer)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  const ключ       = `market/${session.user.id}-${Date.now()}-${index}.webp`

  await r2Client().send(new PutObjectCommand({
    Bucket:       process.env.R2_BUCKET_NAME!,
    Key:          ключ,
    Body:         webp,
    ContentType:  'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  }))

  return Response.json({ url: `${PUBLIC_URL}/${ключ}` })
}
