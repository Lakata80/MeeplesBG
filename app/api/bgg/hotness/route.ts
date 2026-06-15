import { fetchBGGHotness } from '@/lib/bgg/client'

// Кеш за 6 часа
export const revalidate = 21600

export async function GET() {
  try {
    const горещи = await fetchBGGHotness()
    return Response.json({ игри: горещи, общо: горещи.length })
  } catch (грешка) {
    console.error('Грешка при зареждане на BGG hotness:', грешка)
    return Response.json(
      { грешка: 'Неуспешно зареждане на горещия списък' },
      { status: 502 }
    )
  }
}
