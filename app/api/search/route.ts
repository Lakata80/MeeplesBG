import type { NextRequest } from 'next/server'
import { searchGames } from '@/lib/search/queries'

// GET /api/search?q=wingspan&players=2&maxPlaytime=60&sort=rating&page=1
export async function GET(req: NextRequest) {
  const п = req.nextUrl.searchParams

  // ── Парсване на параметри ────────────────────
  const query       = п.get('q')?.trim() ?? ''
  const players     = parsePositiveInt(п.get('players'))
  const minAge      = parsePositiveInt(п.get('minAge'))
  const maxPlaytime = parsePositiveInt(п.get('maxPlaytime'))
  const page        = parsePositiveInt(п.get('page')) ?? 1
  const types       = parseList(п.get('types'))
  const categories  = parseList(п.get('categories'))

  const sortRaw = п.get('sort')
  const sort = sortRaw === 'year' || sortRaw === 'name' || sortRaw === 'rating'
    ? sortRaw
    : 'rating'

  // ── Валидация на страница ────────────────────
  if (page < 1 || page > 500) {
    return Response.json(
      { грешка: 'Невалиден номер на страница (1–500)' },
      { status: 400 }
    )
  }

  // ── Търсене ──────────────────────────────────
  try {
    const резултат = await searchGames({
      query,
      players,
      minAge,
      maxPlaytime,
      types,
      categories,
      sort,
      page,
    })

    return Response.json(резултат)
  } catch (грешка) {
    console.error('Грешка при търсене:', грешка)
    return Response.json(
      { грешка: 'Грешка при свързване с търсачката' },
      { status: 502 }
    )
  }
}

// ── Помощни функции ──────────────────────────
function parsePositiveInt(val: string | null): number | undefined {
  if (!val) return undefined
  const n = parseInt(val, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function parseList(val: string | null): string[] | undefined {
  if (!val) return undefined
  const items = val.split(',').map((s) => s.trim()).filter(Boolean)
  return items.length > 0 ? items : undefined
}
