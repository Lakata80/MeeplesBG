/**
 * Агент за писане на статии за MeeplesBG
 *
 * Употреба:
 *   npx tsx --env-file=.env --env-file=.env.local scripts/write-article.ts \
 *     --topic "SPIEL ESSEN 2025" \
 *     --url "https://www.spiel-essen.de/en/"
 *
 * Флагове:
 *   --topic       Тема на статията (задължителен)
 *   --url         URL за допълнителна информация (незадължителен)
 *   --category    NEWS | REVIEW | BLOG | GUIDE  (по подразбиране: NEWS)
 *   --image-url   URL на снимка за изтегляне и качване в Sanity
 *   --author-id   Sanity _id на автора
 *   --draft       Създай като draft (не публикувай)
 *   --preview     Покажи статията без да я качваш в Sanity
 */

import Anthropic    from '@anthropic-ai/sdk'
import { createClient } from '@sanity/client'
import * as https   from 'https'
import * as http    from 'http'
import * as crypto  from 'crypto'

// ─── Конфигурация ─────────────────────────────────────────────────

const MODEL      = 'claude-sonnet-4-6'
const MAX_TOKENS = 8192

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

// ─── System prompt — стил и глас ─────────────────────────────────

const SYSTEM_PROMPT = `
Ти си редактор на meeplesbg.com — водещия български сайт за настолни игри.
Пишеш статии за секцията "Новини и Статии".

ГЛАС И ТОН:
- Топъл, ентусиазиран, приятелски — като препоръка от добър познат
- Обръщай се към читателите на „вие" (формален множествен)
- Конкретен и информативен: дати, цени, места, брой игри когато са известни
- Без клишета и рекламен език
- Пиши на естествен съвременен български

СТРУКТУРА НА СТАТИЯТА:
- Уводен параграф: закачлив, накратко отговаря на „защо да чета"
- 4–6 секции с h2 подзаглавия (и h3 при нужда)
- Конкретни факти, числа, дати
- Линкове към официалния сайт, BGG страница, и свързани ресурси
- Финален параграф с покана за действие

ДЪЛЖИНА: 500–800 думи

ФОРМАТИРАНЕ НА ОТГОВОРА:
Върни САМО валиден JSON без никаква допълнителна обвивка или обяснение.

{
  "title": "Заглавие до 80 символа",
  "slug": "latin-kebab-case-max-60-chars",
  "excerpt": "1-2 изречения за списъка с новини.",
  "imageQuery": "english search query for a royalty-free cover image",
  "body": [
    { "type": "paragraph", "text": "Текст с **удебелено**, _курсив_, и [линк текст](https://url.com)." },
    { "type": "h2", "text": "Подзаглавие" },
    { "type": "h3", "text": "По-малко подзаглавие" },
    { "type": "bullet", "items": ["Точка 1", "Точка 2 с **удебелено**"] },
    { "type": "number", "items": ["Стъпка 1", "Стъпка 2"] },
    { "type": "blockquote", "text": "Важна информация или цитат" }
  ]
}

ПРАВИЛА:
- slug: само латински букви, цифри и тирета, без диакритика
- Включвай реални URL-и в линковете (официален сайт, BGG, Wikipedia)
- НЕ използвай ASCII кавичка " (U+0022) вътре в текстови стойности — JSON парсерът ще се счупи.
  Ако трябва да цитираш нещо, използвай типографски кавички: „цитат" или \'ескейпнати\'.
- НЕ добавяй нищо извън JSON-а
`.trim()

// ─── CLI аргументи ────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const argv = process.argv.slice(2)
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        out[key] = next
        i++
      } else {
        out[key] = 'true'
      }
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

// ─── Slug транслитерация (Кирилица → Латиница) ───────────────────

const CYR: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',
  ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sht',ъ:'a',ь:'',ю:'yu',я:'ya',
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .split('').map(c => CYR[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

// ─── Уникален ключ за PortableText ───────────────────────────────

const rk = () => crypto.randomBytes(5).toString('hex')

// ─── Поправка на невалиден JSON ──────────────────────────────────
// Фиксира два класа грешки, генерирани от LLM:
//   1. Буквални \n / \r / control chars вътре в стрингове
//   2. Неескейпнати ASCII кавички " вътре в стрингове
//      (хвана с lookahead: ако след " не следва , } ] :, ескейпваме я)

function sanitizeJSON(raw: string): string {
  const chars = [...raw]   // правилно разбиване на Unicode code points
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
        // Lookahead: ако следващият не-whitespace символ е валидно
        // JSON продължение, това е истинският край на стринга.
        let j = i + 1
        while (j < chars.length && ' \t\n\r'.includes(chars[j])) j++
        const next = chars[j] ?? ''
        if (next === ',' || next === '}' || next === ']' || next === ':' || j >= chars.length) {
          inStr = false
          out.push(ch)
        } else {
          // Кавичка вътре в текст — ескейпваме я
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
      if (code < 0x20)      { continue }
    }

    out.push(ch)
  }

  return out.join('')
}

// ─── Inline markdown → PortableText spans ────────────────────────

type PTSpan = {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}
type PTMarkDef = {
  _key: string
  _type: 'link'
  href: string
  blank: boolean
}

function parseInline(text: string): { children: PTSpan[]; markDefs: PTMarkDef[] } {
  const markDefs: PTMarkDef[] = []
  const children: PTSpan[] = []
  // Matches: **bold**, _italic_, [text](url)
  const RE = /(\*\*(.+?)\*\*|_(.+?)_|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = RE.exec(text)) !== null) {
    if (m.index > last) {
      children.push({ _type: 'span', _key: rk(), text: text.slice(last, m.index), marks: [] })
    }
    if (m[0].startsWith('**')) {
      children.push({ _type: 'span', _key: rk(), text: m[2], marks: ['strong'] })
    } else if (m[0].startsWith('_')) {
      children.push({ _type: 'span', _key: rk(), text: m[3], marks: ['em'] })
    } else {
      const lk = rk()
      markDefs.push({ _key: lk, _type: 'link', href: m[5], blank: true })
      children.push({ _type: 'span', _key: rk(), text: m[4], marks: [lk] })
    }
    last = m.index + m[0].length
  }

  if (last < text.length) {
    children.push({ _type: 'span', _key: rk(), text: text.slice(last), marks: [] })
  }
  if (children.length === 0) {
    children.push({ _type: 'span', _key: rk(), text, marks: [] })
  }
  return { children, markDefs }
}

// ─── Simple JSON → PortableText blocks ───────────────────────────

type SimpleBlock =
  | { type: 'paragraph' | 'h2' | 'h3' | 'h4' | 'blockquote'; text: string }
  | { type: 'bullet' | 'number'; items: string[] }

const STYLE_MAP: Record<string, string> = {
  paragraph:  'normal',
  h2:         'h2',
  h3:         'h3',
  h4:         'h4',
  blockquote: 'blockquote',
}

function toPortableText(blocks: SimpleBlock[]): unknown[] {
  const result: unknown[] = []
  for (const b of blocks) {
    if ('items' in b) {
      for (const item of b.items) {
        const { children, markDefs } = parseInline(item)
        result.push({
          _type:    'block',
          _key:     rk(),
          style:    'normal',
          listItem: b.type === 'bullet' ? 'bullet' : 'number',
          level:    1,
          children,
          markDefs,
        })
      }
    } else {
      const { children, markDefs } = parseInline(b.text)
      result.push({
        _type:    'block',
        _key:     rk(),
        style:    STYLE_MAP[b.type] ?? 'normal',
        children,
        markDefs,
      })
    }
  }
  return result
}

// ─── Качване на снимка в Sanity ───────────────────────────────────

async function uploadImage(
  client: ReturnType<typeof sanityWriteClient>,
  imageUrl: string,
  alt: string,
) {
  console.log(`📸  Изтегляне на снимка от: ${imageUrl}`)
  const { buffer, contentType } = await fetchBuffer(imageUrl)
  const ext = contentType.split('/')[1] ?? 'jpg'
  const asset = await client.assets.upload('image', buffer, {
    filename:    `meeplesbg-article-${Date.now()}.${ext}`,
    contentType,
  })
  console.log(`✅  Снимката е качена: ${asset._id}`)
  return {
    _type:  'image' as const,
    asset:  { _type: 'reference' as const, _ref: asset._id },
    alt,
    hotspot: { x: 0.5, y: 0.5, height: 1, width: 1 },
  }
}

// ─── Форматиран предварителен преглед ────────────────────────────

function printPreview(
  article: { title: string; slug: string; excerpt: string; imageQuery?: string; body: SimpleBlock[] },
  category: string,
) {
  const SEP = '─'.repeat(60)
  console.log('\n' + SEP)
  console.log(`ЗАГЛАВИЕ:  ${article.title}`)
  console.log(`SLUG:      ${article.slug}`)
  console.log(`КАТЕГОРИЯ: ${category}`)
  console.log(`EXCERPT:   ${article.excerpt}`)
  if (article.imageQuery) console.log(`СНИМКА:    търсене → "${article.imageQuery}"`)
  console.log(SEP)
  console.log('СЪДЪРЖАНИЕ:\n')
  for (const b of article.body) {
    if (b.type === 'h2')         console.log(`\n## ${b.text}`)
    else if (b.type === 'h3')    console.log(`\n### ${b.text}`)
    else if (b.type === 'h4')    console.log(`\n#### ${b.text}`)
    else if (b.type === 'blockquote') console.log(`\n> ${b.text}`)
    else if (b.type === 'bullet')
      b.items.forEach(i => console.log(`  • ${i}`))
    else if (b.type === 'number')
      b.items.forEach((i, n) => console.log(`  ${n + 1}. ${i}`))
    else console.log(`\n${b.text}`)
  }
  console.log('\n' + SEP)
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const args     = parseArgs()
  const topic    = args['topic']
  const url      = args['url']
  const category = (args['category'] ?? 'NEWS').toUpperCase()
  const imageUrl = args['image-url']
  const authorId = args['author-id']
  const isDraft  = 'draft' in args
  const preview  = 'preview' in args

  if (!topic) {
    console.error('❌  --topic е задължителен')
    console.error('  npm run write:article -- --topic "SPIEL ESSEN 2025" --url "https://www.spiel-essen.de/en/"')
    throw new Error('Липсва --topic')
  }

  console.log(`\n📝  Писане на статия: "${topic}"`)
  if (url) console.log(`🔗  Контекст от: ${url}`)
  if (preview) console.log(`👁   Режим: ПРЕДВАРИТЕЛЕН ПРЕГЛЕД (без публикуване)`)

  // 1. Fetch URL context
  let urlContext = ''
  if (url) {
    try {
      urlContext = await fetchPageText(url)
      console.log(`✅  Извлечен текст: ${urlContext.length} символа`)
    } catch (e) {
      console.warn(`⚠️   Неуспешно извличане от URL: ${(e as Error).message}`)
    }
  }

  // 2. Generate article with Claude
  const claude = new Anthropic()
  console.log('\n🤖  Генериране на статия с Claude...')

  const userMessage = [
    `Напиши статия за: ${topic}`,
    urlContext ? `\nИнформация от официалния сайт:\n${urlContext}` : '',
  ].join('')

  const response = await claude.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userMessage }],
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

  // 3. Parse JSON
  type ArticleJSON = {
    title: string
    slug: string
    excerpt: string
    imageQuery?: string
    body: SimpleBlock[]
  }
  let article: ArticleJSON
  try {
    // Try to extract JSON: from ```json block, or first { ... } pair
    let jsonStr = rawText.trim()
    const codeBlock = rawText.match(/```(?:json)?\s*([\s\S]+?)\s*```/)
    if (codeBlock) {
      jsonStr = codeBlock[1].trim()
    } else {
      const start = rawText.indexOf('{')
      const end   = rawText.lastIndexOf('}')
      if (start !== -1 && end > start) jsonStr = rawText.slice(start, end + 1)
    }
    article = JSON.parse(sanitizeJSON(jsonStr)) as ArticleJSON
  } catch (parseErr) {
    // Write raw and sanitized JSON to logs for debugging
    const fs = await import('fs')
    const logPath = 'logs/write-article-debug.json'
    fs.mkdirSync('logs', { recursive: true })
    fs.writeFileSync(logPath, rawText, 'utf8')
    console.error(`❌  Грешка при парсване на JSON — запазен в ${logPath}`)
    console.error((parseErr as Error).message)
    throw parseErr
  }

  // Normalize slug — force Latin-only regardless of what Claude generated
  article.slug = slugify(article.slug)
  console.log(`✅  Статия готова: "${article.title}"`)

  // 4. Preview mode
  printPreview(article, category)

  if (preview) {
    console.log('ℹ️   Предварителен преглед завършен. Добавете --без флаг preview, за да публикувате.')
    return
  }

  // 5. Convert to PortableText
  const body = toPortableText(article.body)

  // 6. Upload image if provided
  const client = sanityWriteClient()
  let mainImage: unknown = undefined

  if (imageUrl) {
    try {
      mainImage = await uploadImage(client, imageUrl, article.title)
    } catch (e) {
      console.warn(`⚠️   Неуспешно качване на снимка: ${(e as Error).message}`)
    }
  }

  // 7. Create Sanity document
  const docId = isDraft ? `drafts.${crypto.randomUUID()}` : undefined
  const doc: Record<string, unknown> = {
    _type:       'post',
    ...(docId ? { _id: docId } : {}),
    title:       article.title,
    slug:        { _type: 'slug', current: article.slug },
    excerpt:     article.excerpt,
    category,
    publishedAt: new Date().toISOString(),
    body,
    ...(mainImage ? { mainImage } : {}),
    ...(authorId  ? { author: { _type: 'reference', _ref: authorId } } : {}),
  }

  console.log('\n📤  Качване в Sanity...')
  const created = await client.create(doc)

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const studioUrl = `https://${projectId}.sanity.studio/structure/post;${created._id}`
  const siteUrl   = `https://meeplesbg.com/novini/${article.slug}`

  console.log('\n' + '═'.repeat(60))
  console.log(`✅  Статията е ${isDraft ? 'запазена като draft' : 'публикувана'}!`)
  console.log(`📌  Sanity ID:     ${created._id}`)
  console.log(`🔗  Studio URL:    ${studioUrl}`)
  console.log(`🌐  Сайт URL:      ${siteUrl}`)
  if (!mainImage) {
    console.log(`\n⚠️   Добавете главна снимка в Sanity Studio`)
    if (article.imageQuery) console.log(`💡  Препоръчително търсене: "${article.imageQuery}"`)
  }
  console.log('═'.repeat(60) + '\n')
}

main().catch(err => {
  console.error('❌  Грешка:', (err as Error).message)
  process.exit(1)
})
