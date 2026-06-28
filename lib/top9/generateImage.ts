import sharp, { type OverlayOptions } from 'sharp'

// ── Canvas dimensions ──────────────────────────────────────────
const W        = 1080
const H        = 1080
const HEADER_H = 100
const FOOTER_H = 80
const PAD      = 20
const GAP      = 12
const COLS     = 3
const ROWS     = 3

// Cell: (1080 - 2*20 - 2*12) / 3 = 338   ×   (1080 - 100 - 80 - 2*12) / 3 = 292
const CELL_W = Math.floor((W - PAD * 2 - GAP * (COLS - 1)) / COLS)  // 338
const CELL_H = Math.floor((H - HEADER_H - FOOTER_H - GAP * (ROWS - 1)) / ROWS) // 292

const MONTHS_BG = [
  'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
  'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември',
]

// ── Types ──────────────────────────────────────────────────────

export type Top9ImageEntry = {
  position:   number
  playsCount: number | null
  game: {
    titleBg:      string
    thumbnailUrl: string | null
    imageUrl:     string | null
  }
}

export type Top9ImageData = {
  entries:  Top9ImageEntry[]
  month:    number
  year:     number
  userName: string
}

// ── Helpers ────────────────────────────────────────────────────

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

function cellXY(position: number): { x: number; y: number } {
  const col = (position - 1) % COLS
  const row = Math.floor((position - 1) / COLS)
  return {
    x: PAD  + col * (CELL_W + GAP),
    y: HEADER_H + row * (CELL_H + GAP),
  }
}

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapLines(title: string, maxChars = 21): [string, string] {
  if (title.length <= maxChars) return [title, '']
  const cut = title.lastIndexOf(' ', maxChars)
  const split = cut > 0 ? cut : maxChars
  return [title.slice(0, split), title.slice(split + 1, split + 1 + maxChars)]
}

// ── Core generate ──────────────────────────────────────────────

export async function generateTop9Image(data: Top9ImageData): Promise<Buffer> {
  // Fetch + resize all covers in parallel
  const covers = await Promise.all(
    Array.from({ length: 9 }, (_, i) => i + 1).map(async (pos) => {
      const entry = data.entries.find((e) => e.position === pos)
      if (!entry) return { pos, buf: null as Buffer | null }

      const url = entry.game.thumbnailUrl || entry.game.imageUrl
      if (!url) return { pos, buf: null }

      const raw = await fetchImageBuffer(url)
      if (!raw) return { pos, buf: null }

      try {
        const buf = await sharp(raw)
          .resize(CELL_W, CELL_H, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 88 })
          .toBuffer()
        return { pos, buf }
      } catch {
        return { pos, buf: null }
      }
    })
  )

  const coverMap = new Map(covers.map((c) => [c.pos, c.buf]))
  const composites: OverlayOptions[] = []

  // ── Cells ──────────────────────────────────────────────────
  for (let pos = 1; pos <= 9; pos++) {
    const entry = data.entries.find((e) => e.position === pos)
    const { x, y } = cellXY(pos)
    const cover = coverMap.get(pos) ?? null

    if (cover) {
      // Game cover image
      composites.push({ input: cover, left: x, top: y })

      // Bottom-to-top gradient for readability
      composites.push({
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL_W}" height="${CELL_H}">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="40%" stop-color="#000" stop-opacity="0"/>
                <stop offset="100%" stop-color="#000" stop-opacity="0.88"/>
              </linearGradient>
            </defs>
            <rect width="${CELL_W}" height="${CELL_H}" fill="url(#g)"/>
          </svg>`
        ),
        left: x,
        top: y,
      })
    } else {
      // Dark placeholder for empty / missing-image slot
      const placeholder = await sharp({
        create: { width: CELL_W, height: CELL_H, channels: 3, background: { r: 22, g: 33, b: 52 } },
      }).jpeg().toBuffer()
      composites.push({ input: placeholder, left: x, top: y })

      // Faint position number for empty slots
      composites.push({
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL_W}" height="${CELL_H}">
            <text x="${CELL_W / 2}" y="${CELL_H / 2 + 24}" text-anchor="middle"
              font-family="DejaVu Sans,Arial,sans-serif" font-size="72"
              font-weight="bold" fill="#1e3a5f">${pos}</text>
          </svg>`
        ),
        left: x,
        top: y,
      })
    }

    // Position badge (gold circle) — always shown
    const B = 30
    composites.push({
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${B}" height="${B}">
          <circle cx="${B / 2}" cy="${B / 2}" r="${B / 2}" fill="#E4A835"/>
          <text x="${B / 2}" y="${B / 2 + 5}" text-anchor="middle"
            font-family="DejaVu Sans,Arial,sans-serif" font-size="14"
            font-weight="bold" fill="#0f172a">${pos}</text>
        </svg>`
      ),
      left: x + 8,
      top: y + 8,
    })

    // Title + plays (only for filled entries)
    if (entry) {
      const [line1, line2] = wrapLines(entry.game.titleBg)
      const playsText = entry.playsCount ? `${entry.playsCount}× партии` : ''
      const INFO_H = 72
      composites.push({
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${CELL_W}" height="${INFO_H}">
            <text x="8" y="20" font-family="DejaVu Sans,Arial,sans-serif"
              font-size="13" font-weight="bold" fill="white">${escXml(line1)}</text>
            ${line2 ? `<text x="8" y="38" font-family="DejaVu Sans,Arial,sans-serif"
              font-size="13" font-weight="bold" fill="white">${escXml(line2)}</text>` : ''}
            ${playsText ? `<text x="8" y="${line2 ? 58 : 40}" font-family="DejaVu Sans,Arial,sans-serif"
              font-size="11" fill="#F5D07A">${escXml(playsText)}</text>` : ''}
          </svg>`
        ),
        left: x,
        top: y + CELL_H - INFO_H,
      })
    }
  }

  // ── Header ─────────────────────────────────────────────────
  const monthName = (MONTHS_BG[data.month - 1] ?? '').toUpperCase()
  composites.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${HEADER_H}">
        <text x="${W / 2}" y="52" text-anchor="middle"
          font-family="DejaVu Sans,Arial,sans-serif" font-size="30"
          font-weight="bold" fill="white" letter-spacing="4">МОЯТ ТОП 9</text>
        <text x="${W / 2}" y="82" text-anchor="middle"
          font-family="DejaVu Sans,Arial,sans-serif" font-size="18"
          fill="#F5D07A" letter-spacing="3">${escXml(monthName)} ${data.year}</text>
      </svg>`
    ),
    left: 0,
    top: 0,
  })

  // ── Footer ─────────────────────────────────────────────────
  const userLabel = data.userName ? `@${data.userName}` : ''
  composites.push({
    input: Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${FOOTER_H}">
        <line x1="40" y1="18" x2="${W - 40}" y2="18"
          stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="${W / 2}" y="54" text-anchor="middle"
          font-family="DejaVu Sans,Arial,sans-serif" font-size="14"
          fill="rgba(255,255,255,0.38)" letter-spacing="2">meeplesbg.com</text>
        ${userLabel ? `<text x="${W - 44}" y="54" text-anchor="end"
          font-family="DejaVu Sans,Arial,sans-serif" font-size="13"
          fill="rgba(255,255,255,0.28)">${escXml(userLabel)}</text>` : ''}
      </svg>`
    ),
    left: 0,
    top: H - FOOTER_H,
  })

  // ── Compose on dark background ─────────────────────────────
  return sharp({
    create: {
      width:      W,
      height:     H,
      channels:   4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }, // #0f172a
    },
  })
    .composite(composites)
    .png({ compressionLevel: 8 })
    .toBuffer()
}
