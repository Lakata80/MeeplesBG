import type { Game } from '@prisma/client'
import { gamesIndex } from './client'
import type { GameDocument } from './types'

// ──────────────────────────────────────────────
// Конвертира Prisma Game → MeiliSearch документ
// ──────────────────────────────────────────────
export function gameToDocument(игра: Game): GameDocument {
  return {
    id:            игра.id,
    bggId:         игра.bggId,
    slug:          игра.slug,
    titleBg:       игра.titleBg,
    titleEn:       игра.titleEn,
    descriptionBg: игра.descriptionBg,
    yearPublished: игра.yearPublished,
    minPlayers:    игра.minPlayers,
    maxPlayers:    игра.maxPlayers,
    minPlaytime:   игра.minPlaytime,
    maxPlaytime:   игра.maxPlaytime,
    minAge:        игра.minAge,
    weight:        игра.weight,
    bggRating:     игра.bggRating,
    ourRating:     игра.ourRating,
    thumbnailUrl:  игра.thumbnailUrl,
    imageUrl:      игра.imageUrl,
    categories:    игра.categories,
    mechanics:     игра.mechanics,
    types:         игра.types,
  }
}

// ──────────────────────────────────────────────
// Конфигурира атрибутите на индекса
// ──────────────────────────────────────────────
export async function configureIndex(): Promise<void> {
  await gamesIndex.updateSettings({
    searchableAttributes: [
      'titleBg',
      'titleEn',
      'categories',
      'mechanics',
    ],
    filterableAttributes: [
      'minPlayers',
      'maxPlayers',
      'minAge',
      'maxPlaytime',
      'weight',
      'types',
      'categories',
      'yearPublished',
      'bggRating',
      'ourRating',
    ],
    sortableAttributes: [
      'bggRating',
      'ourRating',
      'yearPublished',
      'titleBg',
    ],
    pagination: {
      maxTotalHits: 10000,
    },
    distinctAttribute: 'id',
    typoTolerance: {
      enabled:       true,
      minWordSizeForTypos: { oneTypo: 6, twoTypos: 10 },
    },
  })
}

// ──────────────────────────────────────────────
// Индексира / обновява една игра
// ──────────────────────────────────────────────
export async function indexGame(игра: Game): Promise<void> {
  await gamesIndex.addDocuments([gameToDocument(игра)])
}

// ──────────────────────────────────────────────
// Индексира всички активни игри от PostgreSQL
// ──────────────────────────────────────────────
export async function indexAllGames(
  prisma: { game: { findMany: (args: object) => Promise<Game[]> } },
  onProgress?: (indexed: number, total: number) => void
): Promise<number> {
  const BATCH = 500
  let пропуснати = 0
  let общо = 0

  // Намери общ брой
  const всички = await prisma.game.findMany({
    where: { isActive: true },
    select: { id: true } as object,
  }) as { id: string }[]
  общо = всички.length

  // Индексирай на батчове
  for (let skip = 0; skip < общо; skip += BATCH) {
    const игри = await prisma.game.findMany({
      where:  { isActive: true },
      skip,
      take:   BATCH,
      orderBy: { createdAt: 'asc' } as object,
    })

    if (игри.length === 0) break

    const документи = игри.map(gameToDocument)
    await gamesIndex.addDocuments(документи)
    пропуснати += игри.length
    onProgress?.(пропуснати, общо)
  }

  return общо
}

// ──────────────────────────────────────────────
// Изтрива игра от индекса
// ──────────────────────────────────────────────
export async function deleteGameFromIndex(id: string): Promise<void> {
  await gamesIndex.deleteDocument(id)
}
