import { Meilisearch } from 'meilisearch'
import type { GameDocument } from './types'

export { type GameDocument }

const клиент = new Meilisearch({
  host:   process.env.MEILI_HOST ?? 'http://localhost:7700',
  apiKey: process.env.MEILI_API_KEY,
})

// Индекс за настолни игри — типизиран с GameDocument
export const gamesIndex = клиент.index<GameDocument>('games')

export default клиент
