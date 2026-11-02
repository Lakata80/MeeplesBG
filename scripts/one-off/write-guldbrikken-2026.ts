/**
 * Еднократен скрипт за статия: Guldbrikken 2026 номинации
 *
 * Употреба:
 *   npx tsx --env-file=.env --env-file=.env.local scripts/write-guldbrikken-2026.ts --preview
 *   npx tsx --env-file=.env --env-file=.env.local scripts/write-guldbrikken-2026.ts
 *   npx tsx --env-file=.env --env-file=.env.local scripts/write-guldbrikken-2026.ts --draft
 */

import Anthropic         from '@anthropic-ai/sdk'
import { createClient }  from '@sanity/client'
import { PrismaClient }  from '@prisma/client'
import * as crypto       from 'crypto'

// ─── Конфигурация ─────────────────────────────────────────────────

const MODEL      = 'claude-sonnet-4-6'
const MAX_TOKENS = 8192
const DOC_SLUG   = 'guldbrikken-2026-nominacii'

// Игри за проверка в базата — slug → показвано заглавие
const GAMES_TO_CHECK: Record<string, string> = {
  'castle-combo':       'Castle Combo',
  'kariba':             'Kariba',
  'flip-7':             'Flip 7',
  'regicide':           'Regicide',
  'restart':            'Restart',
  'redwoods':           'Redwoods',
  'plakks':             'Plakks',
  'agent-avenue':       'Agent Avenue',
  '7-wonders-dice':     '7 Wonders Dice',
  'rebel-princess':     'Rebel Princess',
  'bazarquatik':        'Bazarquatik',
  'coco-crazy-bananas': 'Coco Crazy: Bananas!',
  'pirates-n-dice':     "Pirates 'n' Dice",
  'things-in-rings':    'Things in Rings',
}

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
Пишеш статии за секцията "Новини и Статии".

ГЛАС И ТОН:
- Топъл, ентусиазиран, приятелски — като препоръка от добър познат
- Обръщай се към читателите на „вие" (формален множествен)
- Конкретен и информативен: дати, цени, места, брой игри когато са известни
- Без клишета и рекламен език
- Пиши на естествен съвременен български

СТРУКТУРА НА СТАТИЯТА:
- Уводен параграф: закачлив, накратко отговаря на „защо да чета"
- Секции с h2 подзаглавия (и h3 при нужда)
- Конкретни факти, числа, дати
- Линкове към официалния сайт, BGG страница, и свързани ресурси
- Финален параграф с покана за действие

ФОРМАТИРАНЕ НА ОТГОВОРА:
Върни САМО валиден JSON без никаква допълнителна обвивка или обяснение.

{
  "title": "Заглавие до 80 символа",
  "slug": "latin-kebab-case-max-60-chars",
  "excerpt": "1-2 изречения за списъка с новини.",
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
      if (next && !next.startsWith('--')) { out[key] = next; i++ }
      else out[key] = 'true'
    }
  }
  return out
}

// ─── Уникален ключ за PortableText ───────────────────────────────

const rk = () => crypto.randomBytes(5).toString('hex')

// ─── Поправка на невалиден JSON ──────────────────────────────────

function sanitizeJSON(raw: string): string {
  const chars = [...raw]
  const out: string[] = []
  let inStr = false
  let escaped = false

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (escaped) { out.push(ch); escaped = false; continue }
    if (ch === '\\' && inStr) { out.push(ch); escaped = true; continue }
    if (ch === '"') {
      if (!inStr) {
        inStr = true; out.push(ch)
      } else {
        let j = i + 1
        while (j < chars.length && ' \t\n\r'.includes(chars[j])) j++
        const next = chars[j] ?? ''
        if (next === ',' || next === '}' || next === ']' || next === ':' || j >= chars.length) {
          inStr = false; out.push(ch)
        } else {
          out.push('\\"')
        }
      }
      continue
    }
    if (inStr) {
      if (ch === '\n') { out.push('\\n'); continue }
      if (ch === '\r') { out.push('\\r'); continue }
      if (ch === '\t') { out.push('\\t'); continue }
      const code = ch.codePointAt(0) ?? 0
      if (code < 0x20) continue
    }
    out.push(ch)
  }
  return out.join('')
}

// ─── Inline markdown → PortableText spans ────────────────────────

type PTSpan = { _type: 'span'; _key: string; text: string; marks: string[] }
type PTMarkDef = { _key: string; _type: 'link'; href: string; blank: boolean }

function parseInline(text: string): { children: PTSpan[]; markDefs: PTMarkDef[] } {
  const markDefs: PTMarkDef[] = []
  const children: PTSpan[] = []
  const RE = /(\*\*(.+?)\*\*|_(.+?)_|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = RE.exec(text)) !== null) {
    if (m.index > last)
      children.push({ _type: 'span', _key: rk(), text: text.slice(last, m.index), marks: [] })
    if (m[0].startsWith('**'))
      children.push({ _type: 'span', _key: rk(), text: m[2], marks: ['strong'] })
    else if (m[0].startsWith('_'))
      children.push({ _type: 'span', _key: rk(), text: m[3], marks: ['em'] })
    else {
      const lk = rk()
      markDefs.push({ _key: lk, _type: 'link', href: m[5], blank: true })
      children.push({ _type: 'span', _key: rk(), text: m[4], marks: [lk] })
    }
    last = m.index + m[0].length
  }
  if (last < text.length)
    children.push({ _type: 'span', _key: rk(), text: text.slice(last), marks: [] })
  if (children.length === 0)
    children.push({ _type: 'span', _key: rk(), text, marks: [] })
  return { children, markDefs }
}

// ─── Simple JSON → PortableText blocks ───────────────────────────

type SimpleBlock =
  | { type: 'paragraph' | 'h2' | 'h3' | 'h4' | 'blockquote'; text: string }
  | { type: 'bullet' | 'number'; items: string[] }

const STYLE_MAP: Record<string, string> = {
  paragraph: 'normal', h2: 'h2', h3: 'h3', h4: 'h4', blockquote: 'blockquote',
}

function toPortableText(blocks: SimpleBlock[]): unknown[] {
  const result: unknown[] = []
  for (const b of blocks) {
    if ('items' in b) {
      for (const item of b.items) {
        const { children, markDefs } = parseInline(item)
        result.push({
          _type: 'block', _key: rk(), style: 'normal',
          listItem: b.type === 'bullet' ? 'bullet' : 'number',
          level: 1, children, markDefs,
        })
      }
    } else {
      const { children, markDefs } = parseInline(b.text)
      result.push({ _type: 'block', _key: rk(), style: STYLE_MAP[b.type] ?? 'normal', children, markDefs })
    }
  }
  return result
}

// ─── Preview ─────────────────────────────────────────────────────

function printPreview(article: { title: string; slug: string; excerpt: string; body: SimpleBlock[] }) {
  const SEP = '─'.repeat(60)
  console.log('\n' + SEP)
  console.log(`ЗАГЛАВИЕ:  ${article.title}`)
  console.log(`SLUG:      ${article.slug}`)
  console.log(`EXCERPT:   ${article.excerpt}`)
  console.log(SEP)
  console.log('СЪДЪРЖАНИЕ:\n')
  for (const b of article.body) {
    if (b.type === 'h2')        console.log(`\n## ${b.text}`)
    else if (b.type === 'h3')   console.log(`\n### ${b.text}`)
    else if (b.type === 'blockquote') console.log(`\n> ${b.text}`)
    else if (b.type === 'bullet')  b.items.forEach(i => console.log(`  • ${i}`))
    else if (b.type === 'number')  b.items.forEach((i, n) => console.log(`  ${n + 1}. ${i}`))
    else if ('text' in b)       console.log(`\n${b.text}`)
  }
  console.log('\n' + SEP)
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  const args    = parseArgs()
  const isDraft = 'draft' in args
  const preview = 'preview' in args

  if (preview) console.log('👁   Режим: ПРЕДВАРИТЕЛЕН ПРЕГЛЕД (без публикуване)')
  if (isDraft) console.log('📋  Режим: DRAFT')

  // 1. Провери кои игри съществуват в базата
  const prisma = new PrismaClient()
  console.log('\n🔍  Проверка на игри в базата данни...')
  const foundGames = await prisma.game.findMany({
    where: { slug: { in: Object.keys(GAMES_TO_CHECK) } },
    select: { slug: true, titleBg: true },
  }).finally(() => prisma.$disconnect())

  const foundSlugs = new Set(foundGames.map(g => g.slug))
  console.log(`✅  Намерени: ${foundGames.map(g => g.titleBg ?? g.slug).join(', ') || 'никоя'}`)

  // Функция за форматиране на игра с/без линк
  const gameLink = (slug: string, name: string) =>
    foundSlugs.has(slug)
      ? `[${name}](https://www.meeplesbg.com/igri/${slug})`
      : `**${name}**`

  // 2. Изгради user message
  const userMessage = `
Напиши статия за: Guldbrikken 2026 — датска независима награда за настолни игри

СТРУКТУРА (8 секции с h2):
1. Какво е Guldbrikken?
2. История на наградата
3. Как работи журито?
4. Категориите през 2026 г.
5. Всички номинирани игри (изброи по категории с bullet списъци)
6. Кои заглавия правят най-силно впечатление?
7. Кога и къде ще бъдат обявени победителите?
8. Защо Guldbrikken заслужава внимание и извън Дания?

ФАКТИ ЗА НАГРАДАТА:
- Guldbrikken („Златният жетон") е датска независима награда за настолни игри
- Връчва се ежегодно от датско журито на любители на настолни игри
- Не е свързана с нито един издател или магазин — напълно независима
- Официален сайт: https://guldbrikken.dk

КАТЕГОРИИ ПРЕЗ 2026 Г.:
- 🧒 Årets Børnespil — Детска игра на годината
- 👨‍👩‍👧‍👦 Årets Familiespil — Семейна игра на годината
- 🎉 Årets Selskabsspil — Парти/социална игра на годината
- 🧠 Årets Voksenspil — Игра за възрастни на годината
- Журито връчва и Specialpris (специална награда по своя преценка)

НОМИНИРАНИ ИГРИ ПРЕЗ 2026 Г.:

Детска игра (Årets Børnespil):
- ${gameLink('pirates-n-dice', "Pirates 'n' Dice")}
- ${gameLink('redwoods', 'Redwoods')}
- ${gameLink('coco-crazy-bananas', 'Coco Crazy: Bananas!')}

Семейна игра (Årets Familiespil):
- ${gameLink('kariba', 'Kariba')}
- ${gameLink('bazarquatik', 'Bazarquatik')}
- ${gameLink('agent-avenue', 'Agent Avenue')}
- ${gameLink('restart', 'Restart')}

Парти/социална игра (Årets Selskabsspil):
- ${gameLink('plakks', 'Plakks')}
- ${gameLink('flip-7', 'Flip 7')}
- ${gameLink('things-in-rings', 'Things in Rings')}
- **Hvor er det? Danmark** (датска географска игра, не е в MeeplesBG)

Игра за възрастни (Årets Voksenspil):
- ${gameLink('castle-combo', 'Castle Combo')}
- ${gameLink('7-wonders-dice', '7 Wonders Dice')}
- ${gameLink('rebel-princess', 'Rebel Princess')}
- ${gameLink('regicide', 'Regicide')}

ЦЕРЕМОНИЯ:
- Дата: 11 октомври 2026 г.
- Място: Kulturhus Absalon, Копенхаген, Дания
- Победителите все още не са обявени

ВАЖНО: Там където е посочен линк към игра (https://www.meeplesbg.com/igri/...), използвай точно тези линкове в статията.
За игри без линк — само **удебелено** заглавие.
Добави и линк към официалния сайт https://guldbrikken.dk и към BGG страницата на Guldbrikken https://boardgamegeek.com/boardgamehonor/guldbrikken там където е уместно.
`.trim()

  // 3. Генерирай с Claude
  const claude = new Anthropic()
  console.log('\n🤖  Генериране на статия с Claude...')

  const response = await claude.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userMessage }],
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

  // 4. Parse JSON
  type ArticleJSON = { title: string; slug: string; excerpt: string; body: SimpleBlock[] }
  let article: ArticleJSON
  try {
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
    const fs = await import('fs')
    fs.mkdirSync('logs', { recursive: true })
    fs.writeFileSync('logs/guldbrikken-debug.json', rawText, 'utf8')
    console.error('❌  Грешка при парсване на JSON — запазен в logs/guldbrikken-debug.json')
    throw parseErr
  }

  // Фиксиран slug — не го взимаме от Claude
  article.slug = DOC_SLUG
  console.log(`✅  Статия готова: "${article.title}"`)

  // 5. Preview
  printPreview(article)

  if (preview) {
    console.log('\n👁   Предварителен преглед завършен. Пусни без --preview за да публикуваш.')
    return
  }

  // 6. Публикувай в Sanity
  const body = toPortableText(article.body)
  const client = sanityWriteClient()
  const docId = isDraft ? `drafts.guldbrikken-2026` : undefined

  const doc: { _type: string } & Record<string, unknown> = {
    _type:       'post',
    ...(docId ? { _id: docId } : {}),
    title:       article.title,
    slug:        { _type: 'slug', current: article.slug },
    excerpt:     article.excerpt,
    category:    'NEWS',
    publishedAt: new Date().toISOString(),
    body,
  }

  console.log(`\n📤  Публикуване в Sanity${isDraft ? ' (draft)' : ''}...`)
  const created = await client.create(doc)

  console.log('\n' + '═'.repeat(60))
  console.log(`✅  Статията е ${isDraft ? 'запазена като draft' : 'публикувана'}!`)
  console.log(`📌  Sanity ID:  ${created._id}`)
  console.log(`🌐  Сайт URL:   https://www.meeplesbg.com/novini/${article.slug}`)
  console.log(`\n⚠️   Добавете главна снимка в Sanity Studio`)
  console.log(`💡  Търсете: „Guldbrikken award" или използвайте лого от https://guldbrikken.dk`)
  console.log('═'.repeat(60) + '\n')
}

main().catch(err => {
  console.error('❌  Грешка:', (err as Error).message)
  process.exit(1)
})
