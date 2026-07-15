import { revalidatePath } from 'next/cache'
import type { NextRequest } from 'next/server'

// POST /api/revalidate?secret=<SANITY_REVALIDATE_SECRET>
// Извиква се от Sanity webhook при всяка промяна на weeklyGame или post.
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')

  if (!process.env.SANITY_REVALIDATE_SECRET) {
    console.error('[revalidate] SANITY_REVALIDATE_SECRET не е зададен')
    return Response.json({ message: 'Webhook not configured' }, { status: 500 })
  }

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid secret' }, { status: 401 })
  }

  let body: { _type?: string; slug?: { current?: string } }
  try {
    body = await req.json()
  } catch {
    return Response.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const type = body._type
  const slug = body.slug?.current

  if (type === 'weeklyGame') {
    revalidatePath('/igri/igra-na-sedmicata')
    revalidatePath('/igri/populiarni')
    if (slug) revalidatePath(`/igri/igra-na-sedmicata/${slug}`)
  } else if (type === 'post') {
    revalidatePath('/novini')
    if (slug) revalidatePath(`/novini/${slug}`)
  } else {
    // Непознат тип — обнови всичко свързано със Sanity
    revalidatePath('/igri/igra-na-sedmicata')
    revalidatePath('/igri/populiarni')
    revalidatePath('/novini')
  }

  console.log(`[revalidate] ✅ type=${type} slug=${slug ?? '—'}`)
  return Response.json({ revalidated: true, type, slug: slug ?? null })
}
