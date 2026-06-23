import type { NextRequest } from 'next/server'
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { auth }   from '@/auth'
import { prisma } from '@/lib/prisma'

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
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ грешка: 'Необходим е вход.' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'ADMIN') return Response.json({ грешка: 'Забранено.' }, { status: 403 })

  const { id } = await params
  const { action } = await request.json() as { action: 'approve' | 'reject' }

  const pending = await prisma.pendingImage.findUnique({
    where:   { id },
    include: { game: { select: { id: true, bggId: true, slug: true } } },
  })
  if (!pending) return Response.json({ грешка: 'Не е намерено.' }, { status: 404 })

  if (action === 'reject') {
    await prisma.pendingImage.update({ where: { id }, data: { status: 'REJECTED' } })
    return Response.json({ ok: true })
  }

  if (action === 'approve') {
    const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
    const BUCKET     = process.env.R2_BUCKET_NAME!
    const s3         = r2Client()

    // Извлечи ключа от URL-а
    const pendingKey = pending.url.replace(`${PUBLIC_URL}/`, '')
    // Уникален финален ключ — новият URL задължително се различава от стария,
    // за да не се показва старото кеширано изображение в браузъра
    const finalKey = `games/approved/${pending.game.bggId ?? pending.game.id}-${Date.now()}.webp`

    // Копирай от pending/ към approved/
    await s3.send(new CopyObjectCommand({
      Bucket:     BUCKET,
      CopySource: `${BUCKET}/${pendingKey}`,
      Key:        finalKey,
      ContentType:  'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
      MetadataDirective: 'REPLACE',
    }))

    // Изтрий оригинала от pending/
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: pendingKey }))

    const finalUrl = `${PUBLIC_URL}/${finalKey}`

    // Само маркирай като одобрена — НЕ пипай game.imageUrl
    await prisma.pendingImage.update({ where: { id }, data: { status: 'APPROVED', url: finalUrl } })

    return Response.json({ ok: true, url: finalUrl })
  }

  return Response.json({ грешка: 'Невалидно действие.' }, { status: 400 })
}
