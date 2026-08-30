/**
 * Създава „Игра на седмицата" документ в Sanity за Scythe, Седмица 33.
 *
 * Употреба:
 *   npx tsx --env-file=.env --env-file=.env.local scripts/create-weekly-game.ts
 *   npx tsx --env-file=.env --env-file=.env.local scripts/create-weekly-game.ts --preview
 *   npx tsx --env-file=.env --env-file=.env.local scripts/create-weekly-game.ts --draft
 *
 * Флагове:
 *   --preview   Покажи генерирания текст без да качваш в Sanity
 *   --draft     Запази като draft (не публикувай)
 */

import Anthropic       from '@anthropic-ai/sdk'
import { createClient } from '@sanity/client'
import { PrismaClient } from '@prisma/client'
import * as https      from 'https'
import * as http       from 'http'

// ─── Конфигурация ─────────────────────────────────────────────────

const MODEL      = 'claude-sonnet-4-6'
const MAX_TOKENS = 2048

const GAME_SLUG  = 'endeavor-deep-sea'
const GAME_NAME  = 'Endeavor: Deep Sea'
const WEEK_LABEL = 'Седмица 35, 2026'
const DOC_SLUG   = 'endeavor-deep-sea-2026-w35'

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

// ─── System prompt ────────────────────────────────────────────────

const SYSTEM_PROMPT = `
Ти си редактор на meeplesbg.com — водещия български сайт за настолни игри.
Пишеш редакционни текстове за секцията „Игра на седмицата".

ГЛАС И ТОН:
- Топъл, ентусиазиран, приятелски — като препоръка от добър познат
- Обръщай се към читателите на „вие" (формален множествен)
- Конкретен и информативен: механики, тема, усещане от игра
- Без клишета и рекламен език
- Пиши на естествен съвременен български

СТРУКТУРА:
- headlineBg: 1 кратко изречение-слоган до 80 знака, евокативно и образно
  Пример: „Лоялността е инструмент. Победата е изкуство."
- teaserBg: 4–5 параграфа (350–500 думи) — защо играта е избрана тази седмица,
  какво я прави специална, какво усещане дава на масата.
  НЕ преразказвай правилата. Пиши за усещането, темата, защо ще ви грабне.

ФОРМАТИРАНЕ НА ОТГОВОРА:
Върни САМО валиден JSON без никаква допълнителна обвивка или обяснение.

{
  "headlineBg": "...",
  "teaserBg": "..."
}

ПРАВИЛА:
- НЕ използвай ASCII кавичка " вътре в текстови стойности — JSON парсерът ще се счупи.
  Ако трябва да цитираш нещо, използвай типографски кавички: „цитат".
- НЕ добавяй нищо извън JSON-а
`.trim()

// ─── CLI аргументи ────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const argv = process.argv.slice(2)
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key  = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) { out[key] = next; i++ }
      else out[key] = 'true'
    }
  }
  return out
}

// ─── HTTP fetch на текст (stripped HTML) ──────────────────────────

async function fetchPageText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 MeeplesBG-Bot/1.0',
        'Accept':     'text/html,application/xhtml+xml',
      },
    }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        fetchPageText(res.headers.location).then(resolve).catch(reject)
        return
      }
      let raw = ''
      res.setEncoding('utf8')
      res.on('data', chunk => { raw += chunk })
      res.on('end', () => {
        const text = raw
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#\d+;/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 6000)
        resolve(text)
      })
    })
    req.on('error', reject)
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout при fetch на ' + url)) })
  })
}

// ─── HTTP fetch на бинарни данни (снимки) ────────────────────────

async function fetchBuffer(url: string, depth = 0): Promise<{ buffer: Buffer; contentType: string }> {
  if (depth > 3) throw new Error('Твърде много пренасочвания')
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, { headers: { 'User-Agent': 'MeeplesBG-Bot/1.0' } }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        fetchBuffer(res.headers.location, depth + 1).then(resolve).catch(reject)
        return
      }
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(chunk as Buffer))
      res.on('end', () => resolve({
        buffer:      Buffer.concat(chunks),
        contentType: (res.headers['content-type'] ?? 'image/jpeg').split(';')[0],
      }))
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout при изтегляне на снимка')) })
  })
}

// ─── Поправка на невалиден JSON ──────────────────────────────────

function sanitizeJSON(raw: string): string {
  const chars = [...raw]
  const out: string[] = []
  let inStr   = false
  let escaped = false

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]

    if (escaped) { out.push(ch); escaped = false; continue }
    if (ch === '\\' && inStr) { out.push(ch); escaped = true; continue }

    if (ch === '"') {
      if (!inStr) {
        inStr = true
        out.push(ch)
      } else {
        let j = i + 1
        while (j < chars.length && ' \t\n\r'.includes(chars[j])) j++
        const next = chars[j] ?? ''
        if (next === ',' || next === '}' || next === ']' || next === ':' || j >= chars.length) {
          inStr = false
          out.push(ch)
        } else {
          out.push('\\"')
        }
      }
      continue
    }

    if (inStr) {
      if (ch === '\n')      { out.push('\\n');  continue }
      if (ch === '\r')      { out.push('\\r');  continue }
      if (ch === '\t')      { out.push('\\t');  continue }
      const code = ch.codePointAt(0) ?? 0
      if (code < 0x20) continue
    }

    out.push(ch)
  }

  return out.join('')
}

// ─── Качване на снимка в Sanity ───────────────────────────────────

async function uploadImage(
  client: ReturnType<typeof sanityWriteClient>,
  imageUrl: string,
  alt: string,
) {
  console.log(`📸  Изтегляне на снимка от: ${imageUrl}`)
  const { buffer, contentType } = await fetchBuffer(imageUrl)
  const ext   = contentType.split('/')[1] ?? 'jpg'
  const asset = await client.assets.upload('image', buffer, {
    filename:    `weekly-game-scythe-${Date.now()}.${ext}`,
    contentType,
  })
  console.log(`✅  Снимката е качена: ${asset._id}`)
  return {
    _type:   'image' as const,
    asset:   { _type: 'reference' as const, _ref: asset._id },
    alt,
    hotspot: { x: 0.5, y: 0.5, height: 1, width: 1 },
  }
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const args    = parseArgs()
  const isDraft = 'draft' in args
  const preview = 'preview' in args

  if (preview) console.log('👁   Режим: ПРЕДВАРИТЕЛЕН ПРЕГЛЕД (без публикуване в Sanity)')
  if (isDraft) console.log('📋  Режим: DRAFT (ще се запази като чернова)')

  const prisma = new PrismaClient()

  // 1. Вземи imageUrl от Prisma
  console.log(`\n🔍  Търсене на играта „${GAME_SLUG}" в базата данни...`)
  const game = await prisma.game.findUnique({
    where:  { slug: GAME_SLUG },
    select: { imageUrl: true, titleBg: true, descriptionBg: true },
  }).finally(() => prisma.$disconnect())

  if (!game) throw new Error(`Играта „${GAME_SLUG}" не е намерена в базата данни`)
  console.log(`✅  Намерена: ${game.titleBg ?? GAME_NAME}`)

  // 2. Fetch контекст от сайта
  let pageContext = ''
  try {
    console.log(`\n🌐  Извличане на контекст от meeplesbg.com/igri/${GAME_SLUG}...`)
    pageContext = await fetchPageText(`https://www.meeplesbg.com/igri/${GAME_SLUG}`)
    console.log(`✅  Извлечен текст: ${pageContext.length} символа`)
  } catch (e) {
    console.warn(`⚠️   Неуспешно извличане от сайта: ${(e as Error).message}`)
    if (game.descriptionBg) pageContext = game.descriptionBg.slice(0, 3000)
  }

  // 3. Генерирай с Claude
  const claude = new Anthropic()
  console.log(`\n🤖  Генериране на редакционен текст за „${GAME_NAME}" с Claude...`)

  const userMessage = [
    `Напиши „Игра на седмицата" текст за: ${GAME_NAME}`,
    `Седмица: ${WEEK_LABEL}`,
    pageContext ? `\nИнформация от страницата на играта:\n${pageContext}` : '',
  ].filter(Boolean).join('\n')

  const response = await claude.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userMessage }],
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

  // 4. Parse JSON
  type GeneratedContent = { headlineBg: string; teaserBg: string }
  let content: GeneratedContent
  try {
    let jsonStr      = rawText.trim()
    const codeBlock  = rawText.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
    if (codeBlock) {
      jsonStr = codeBlock[1].trim()
    } else {
      const start = rawText.indexOf('{')
      const end   = rawText.lastIndexOf('}')
      if (start !== -1 && end > start) jsonStr = rawText.slice(start, end + 1)
    }
    content = JSON.parse(sanitizeJSON(jsonStr)) as GeneratedContent
  } catch (parseErr) {
    const fs = await import('fs')
    fs.mkdirSync('logs', { recursive: true })
    fs.writeFileSync('logs/create-weekly-game-debug.json', rawText, 'utf8')
    console.error('❌  Грешка при парсване на JSON — запазен в logs/create-weekly-game-debug.json')
    throw parseErr
  }

  // 5. Preview
  const SEP = '─'.repeat(60)
  console.log('\n' + SEP)
  console.log(`SLUG:      ${DOC_SLUG}`)
  console.log(`СЕДМИЦА:   ${WEEK_LABEL}`)
  console.log(`HEADLINE:  ${content.headlineBg}`)
  console.log(SEP)
  console.log('TEASER:\n')
  console.log(content.teaserBg)
  console.log('\n' + SEP)

  if (preview) {
    console.log('\n👁   Предварителен преглед завършен. Пусни без --preview за да публикуваш.')
    return
  }

  // 6. Създай Sanity клиент
  const client = sanityWriteClient()

  // 7. Upload снимка
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bannerImage: any = undefined
  if (game.imageUrl) {
    try {
      bannerImage = await uploadImage(client, game.imageUrl, `${GAME_NAME} — настолна игра`)
    } catch (e) {
      console.warn(`⚠️   Неуспешно качване на снимка: ${(e as Error).message}`)
    }
  } else {
    console.warn('⚠️   Няма imageUrl в базата — документът ще използва резервната снимка от DB')
  }

  // 8. Създай weeklyGame документ
  const docId = isDraft ? `drafts.weekly-game-endeavor-deep-sea-2026-w35` : undefined

  const doc = {
    _type:    'weeklyGame',
    ...(docId ? { _id: docId } : {}),
    slug:     { _type: 'slug', current: DOC_SLUG },
    gameSlug: GAME_SLUG,
    gameName: GAME_NAME,
    weekLabel: WEEK_LABEL,
    headlineBg: content.headlineBg,
    teaserBg:   content.teaserBg,
    // @ts-ignore — bannerImage може да е undefined
    ...(bannerImage ? { bannerImage } : {}),
    isActive: false,
  }

  console.log(`\n📤  Публикуване в Sanity${isDraft ? ' (draft)' : ''}...`)
  const created = await client.create(doc)
  console.log(`\n✅  Документът е създаден успешно!`)
  console.log(`    ID:  ${created._id}`)
  console.log(`    URL: https://www.meeplesbg.com/igri/igra-na-sedmicata/${DOC_SLUG}`)
  console.log(`    Studio: /studio (търси „${GAME_NAME}" в weeklyGame)`)
}

main().catch((err) => {
  console.error('\n❌  Грешка:', err.message ?? err)
  process.exit(1)
})
