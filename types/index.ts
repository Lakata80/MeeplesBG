/**
 * Общи TypeScript типове за MeeplesBG
 */

// =====================
// ИГРИ
// =====================

export interface GameSummary {
  id: string
  slug: string
  nameBg: string
  nameEn?: string
  yearPublished?: number
  minPlayers?: number
  maxPlayers?: number
  minPlaytime?: number
  maxPlaytime?: number
  complexity?: number
  bggRating?: number
  thumbnail?: string
  isExpansion: boolean
  categories: { nameBg: string; slug: string }[]
}

export interface GameDetails extends GameSummary {
  descriptionBg?: string
  descriptionEn?: string
  image?: string
  minAge?: number
  bggId?: number
  bggRank?: number
  mechanics: { nameBg: string; slug: string }[]
  designers: { name: string }[]
  publishers: { name: string }[]
  expansions: GameSummary[]
  baseGame?: GameSummary
}

// =====================
// ПОТРЕБИТЕЛИ
// =====================

export interface UserProfile {
  id: string
  name?: string
  username?: string
  image?: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  createdAt: Date
}

// =====================
// КОЛЕКЦИЯ
// =====================

export type CollectionStatus = 'OWNS' | 'WANTS' | 'PLAYED' | 'WISHLIST' | 'PREORDERED'

export const COLLECTION_STATUS_LABELS: Record<CollectionStatus, string> = {
  OWNS: 'Притежавам',
  WANTS: 'Искам',
  PLAYED: 'Играл съм',
  WISHLIST: 'Желателен списък',
  PREORDERED: 'Предварителна поръчка',
}

// =====================
// РЕЦЕНЗИИ
// =====================

export interface Review {
  id: string
  title: string
  content: string
  rating: number
  createdAt: Date
  user: {
    name?: string
    username?: string
    image?: string
  }
}

// =====================
// API ОТГОВОРИ
// =====================

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
