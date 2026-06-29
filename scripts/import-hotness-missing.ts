import { PrismaClient } from '@prisma/client'
import { fetchGamesByIds } from '../lib/bgg/client'

const prisma = new PrismaClient()

const MISSING_IDS = [473061, 451772]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function findUniqueSlug(title: string, bggId: number): Promise<string> {
  const base  = slugify(title) || `game-${bggId}`
  const taken = await prisma.game.findUnique({ where: { slug: base }, select: { bggId: true } })
  if (!taken || taken.bggId === bggId) return base
  return `${base}-${bggId}`
}

async function main() {
  console.log(`🎲 Импортиране на ${MISSING_IDS.length} игри от BGG...\n`)

  const игри = await fetchGamesByIds(MISSING_IDS)
  console.log(`✅ Получени детайли за ${игри.length} игри\n`)

  for (const игра of игри) {
    const съществуваща = await prisma.game.findUnique({ where: { bggId: игра.id }, select: { id: true, slug: true } })
    if (съществуваща) {
      console.log(`⏭  Пропусната (вече съществува): "${игра.titleEn}" → /igri/${съществуваща.slug}`)
      continue
    }

    if (игра.isExpansion) {
      console.log(`⏭  Пропусната (разширение): "${игра.titleEn}"`)
      continue
    }

    const slug = await findUniqueSlug(игра.titleEn, игра.id)

    await prisma.game.create({
      data: {
        bggId:         игра.id,
        slug,
        titleBg:       игра.titleEn,
        titleEn:       игра.titleEn,
        descriptionBg: '',
        descriptionEn: игра.descriptionEn.slice(0, 10_000),
        yearPublished: игра.yearPublished,
        minPlayers:    игра.minPlayers,
        maxPlayers:    игра.maxPlayers,
        minPlaytime:   игра.minPlaytime,
        maxPlaytime:   игра.maxPlaytime,
        minAge:        игра.minAge,
        weight:        игра.weight,
        bggRating:     игра.bggRating,
        imageUrl:      игра.imageUrl,
        thumbnailUrl:  игра.thumbnailUrl,
        categories:    игра.categories,
        mechanics:     игра.mechanics,
        types:         игра.types,
        isActive:      true,
      },
    })

    console.log(`✅ Импортирана: "${игра.titleEn}" → /igri/${slug}`)
    console.log(`   BGG ID: ${игра.id} | Година: ${игра.yearPublished ?? '—'} | Рейтинг: ${игра.bggRating?.toFixed(2) ?? '—'}`)
  }

  console.log('\n✅ Готово!')
}

main()
  .catch((г) => { console.error('\n❌ Грешка:', г); process.exit(1) })
  .finally(() => prisma.$disconnect())
