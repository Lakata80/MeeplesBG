import { NextResponse }                 from 'next/server'
import { S3Client, PutObjectCommand }   from '@aws-sdk/client-s3'
import { auth }                         from '@/auth'
import { prisma }                       from '@/lib/prisma'
import { generateTop9Image }            from '@/lib/top9/generateImage'

// Allow up to 60s — image gen fetches 9 covers in parallel
export const maxDuration = 60

type Params = { params: Promise<{ id: string }> }

function r2() {
  return new S3Client({
    region:   'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

// POST /api/top9/[id]/image
// Generates a 1080×1080 PNG, uploads to R2, returns { imageUrl }
export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const top9 = await prisma.monthlyTop9.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { position: 'asc' },
        include: {
          game: {
            select: { titleBg: true, thumbnailUrl: true, imageUrl: true },
          },
        },
      },
      user: { select: { name: true, bggUsername: true } },
    },
  })

  if (!top9) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (top9.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (top9.entries.length === 0) {
    return NextResponse.json(
      { error: 'Добави поне 1 игра преди да генерираш картинка' },
      { status: 422 }
    )
  }

  // Generate the image buffer
  const buffer = await generateTop9Image({
    entries:  top9.entries,
    month:    top9.month,
    year:     top9.year,
    userName: top9.user.bggUsername ?? top9.user.name ?? '',
  })

  // Upload to R2 — predictable key so regeneration overwrites the old file
  const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '')
  const key        = `top9/${top9.userId}/${top9.year}-${String(top9.month).padStart(2, '0')}.png`

  await r2().send(
    new PutObjectCommand({
      Bucket:       process.env.R2_BUCKET_NAME!,
      Key:          key,
      Body:         buffer,
      ContentType:  'image/png',
      CacheControl: 'public, max-age=3600',
    })
  )

  // Cache-bust timestamp so browser always fetches the latest version
  const imageUrl = `${PUBLIC_URL}/${key}?t=${Date.now()}`

  await prisma.monthlyTop9.update({
    where: { id },
    data:  { generatedImageUrl: imageUrl },
  })

  return NextResponse.json({ imageUrl })
}
