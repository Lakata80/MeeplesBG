/**
 * Скрипт за качване на снимки от BGG → Cloudflare R2 (WebP формат)
 * Употреба: npm run upload:images
 *
 * Изисква в .env:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME, R2_PUBLIC_URL
 *
 * Resumable — прескача игри, чийто imageUrl вече сочи към R2_PUBLIC_URL.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

// ──────────────────────────────────────────────
// Конфигурация
// ──────────────────────────────────────────────

const ЗАКЪСНЕНИЕ  = 500   // ms между качванията
const КАЧЕСТВО    = 85    // WebP quality (0-100)
const LOG_DIR     = path.join(process.cwd(), 'logs')
const LOG_FILE    = path.join(LOG_DIR, 'upload-errors.txt')

// ──────────────────────────────────────────────
// Валидация на env
// ──────────────────────────────────────────────

function getEnv(key: string): string {
  const val = process.env[key]
  if (!val) {
    console.error(`❌  Липсва ${key} в .env`)
    process.exit(1)
  }
  return val
}

// ──────────────────────────────────────────────
// Помощни функции
// ──────────────────────────────────────────────

function прогрес(текущ: number, общо: number, заглавие: string) {
  const процент   = Math.round((текущ / общо) * 100)
  const дължина   = 30
  const запълнени = Math.round((текущ / общо) * дължина)
  const лента     = '█'.repeat(запълнени) + '░'.repeat(дължина - запълнени)
  process.stdout.write(`\r[${лента}] ${процент}% (${текущ}/${общо}) ${заглавие.slice(0, 38).padEnd(38)}`)
}

function логГрешка(бггId: number, заглавие: string, грешка: string) {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
  const ред = `[${new Date().toISOString()}] bggId=${бггId} "${заглавие}" — ${грешка}\n`
  fs.appendFileSync(LOG_FILE, ред)
}

function закъснение(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function свалиКатоБуфер(url: string): Promise<Buffer> {
  const headers: Record<string, string> = {
    'User-Agent': 'MeeplesBG/1.0 image-migration',
  }
  const cookie = process.env.BGG_SESSION_COOKIE
  if (cookie) headers['Cookie'] = `bggusersessionid=${cookie}`

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} при сваляне на ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

// ──────────────────────────────────────────────
// Главна функция
// ──────────────────────────────────────────────

async function main() {
  const ACCOUNT_ID   = getEnv('R2_ACCOUNT_ID')
  const ACCESS_KEY   = getEnv('R2_ACCESS_KEY_ID')
  const SECRET_KEY   = getEnv('R2_SECRET_ACCESS_KEY')
  const BUCKET       = getEnv('R2_BUCKET_NAME')
  const PUBLIC_URL   = getEnv('R2_PUBLIC_URL').replace(/\/$/, '')

  const s3 = new S3Client({
    region:   'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
    },
  })

  const prisma = new PrismaClient()

  try {
    // Взима игри с BGG imageUrl (не мигрирани)
    const игри = await prisma.game.findMany({
      where: {
        AND: [
          { imageUrl: { not: null } },
          { imageUrl: { not: '' } },
          { imageUrl: { not: { startsWith: PUBLIC_URL } } },
        ],
      },
      select: {
        id:       true,
        bggId:    true,
        titleEn:  true,
        titleBg:  true,
        imageUrl: true,
      },
      orderBy: { bggRating: 'desc' },
    })

    if (игри.length === 0) {
      console.log('✓ Всички снимки вече са в Cloudflare R2.')
      return
    }

    console.log(`\n🖼️   Намерени ${игри.length} снимки за качване → R2 (WebP q${КАЧЕСТВО})\n`)

    let успешни = 0
    let прескочени = 0
    let грешки  = 0

    for (let i = 0; i < игри.length; i++) {
      const игра     = игри[i]
      const заглавие = игра.titleBg || игра.titleEn || `bggId=${игра.bggId}`
      const ключ     = `games/${игра.bggId}.webp`

      прогрес(i + 1, игри.length, заглавие)

      try {
        // Провери дали вече съществува в R2 (частичен resume)
        try {
          await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: ключ }))
          // Файлът вече е там — само обнови URL-а в DB
          await prisma.game.update({
            where: { id: игра.id },
            data:  { imageUrl: `${PUBLIC_URL}/${ключ}` },
          })
          прескочени++
          continue
        } catch {
          // Файлът не съществува — продължаваме с качването
        }

        // Свали от BGG
        const буфер = await свалиКатоБуфер(игра.imageUrl!)

        // Конвертирай в WebP
        const webp = await sharp(буфер)
          .webp({ quality: КАЧЕСТВО })
          .toBuffer()

        // Качи в R2
        await s3.send(new PutObjectCommand({
          Bucket:      BUCKET,
          Key:         ключ,
          Body:        webp,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }))

        // Обнови imageUrl в DB
        await prisma.game.update({
          where: { id: игра.id },
          data:  { imageUrl: `${PUBLIC_URL}/${ключ}` },
        })

        успешни++
      } catch (грешка) {
        грешки++
        логГрешка(игра.bggId, заглавие, String(грешка))
      }

      if (i < игри.length - 1) await закъснение(ЗАКЪСНЕНИЕ)
    }

    console.log(`\n\n✓ Готово!`)
    console.log(`  Качени:     ${успешни}`)
    console.log(`  Прескочени: ${прескочени} (вече в R2)`)
    console.log(`  Грешки:     ${грешки}`)
    if (грешки > 0) console.log(`  Лог: ${LOG_FILE}`)
    console.log(`\n  Следваща стъпка: npm run import:reindex\n`)

  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('\n❌  Неочаквана грешка:', err)
  process.exit(1)
})
