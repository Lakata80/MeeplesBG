import type { NextRequest } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })
  }

  const { slug } = await params
  const игра = await prisma.game.findUnique({
    where:  { slug },
    select: { id: true },
  })
  if (!игра) {
    return Response.json({ грешка: 'Играта не е намерена.' }, { status: 404 })
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
  if (file.size > MAX_SIZE) {
    return Response.json({ грешка: 'Максимален размер: 5MB.' }, { status: 400 })
  }

  // Конвертирай в WebP
  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const webp   = await sharp(buffer).webp({ quality: 85 }).toBuffer()

  // Качи в R2
  const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  const ключ       = `games/pending/${игра.id}-${session.user.id}-${Date.now()}.webp`

  await r2Client().send(new PutObjectCommand({
    Bucket:       process.env.R2_BUCKET_NAME!,
    Key:          ключ,
    Body:         webp,
    ContentType:  'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  }))

  const url = `${PUBLIC_URL}/${ключ}`

  await prisma.pendingImage.create({
    data: { gameId: игра.id, userId: session.user.id, url },
  })

  return Response.json({ ok: true })
}
