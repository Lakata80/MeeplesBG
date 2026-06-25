import type { NextRequest } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
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

async function deleteThreadImages(images: string[]) {
  if (!images.length) return
  const publicUrl = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  const client    = r2Client()
  await Promise.all(
    images.map((url) => {
      const key = url.startsWith(publicUrl + '/') ? url.slice(publicUrl.length + 1) : null
      if (!key) return Promise.resolve()
      return client.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }))
    })
  )
}

// PATCH body: { action: 'pin' | 'unpin' | 'close' | 'open' | 'delete' }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user?.id || (role !== 'ADMIN' && role !== 'MODERATOR')) {
    return Response.json({ грешка: 'Нямаш право.' }, { status: 403 })
  }

  const { id } = await params
  const { action } = await request.json() as { action: string }

  switch (action) {
    case 'pin':
      await prisma.thread.update({ where: { id }, data: { isPinned: true } })
      break
    case 'unpin':
      await prisma.thread.update({ where: { id }, data: { isPinned: false } })
      break
    case 'close':
      await prisma.thread.update({ where: { id }, data: { isClosed: true } })
      break
    case 'open':
      await prisma.thread.update({ where: { id }, data: { isClosed: false } })
      break
    case 'delete': {
      const thread = await prisma.thread.findUnique({ where: { id }, select: { images: true } })
      if (thread?.images.length) await deleteThreadImages(thread.images)
      await prisma.thread.delete({ where: { id } })
      break
    }
    default:
      return Response.json({ грешка: 'Невалидно действие.' }, { status: 400 })
  }

  return Response.json({ ok: true })
}
