export interface BggHotnessItem {
  id: number
  rank: number
  name: string
  thumbnailUrl?: string
  yearPublished?: number
}

export interface BggGameDetails {
  id: number
  titleEn: string
  descriptionEn: string
  yearPublished?: number
  minPlayers?: number
  maxPlayers?: number
  minPlaytime?: number
  maxPlaytime?: number
  minAge?: number
  weight?: number
  bggRating?: number
  bggRank?: number
  categoryRanks?: Record<string, number>
  imageUrl?: string
  thumbnailUrl?: string
  categories: string[]
  mechanics: string[]
  types: string[]
  isExpansion: boolean
  expansionBggIds: number[]
  expandsBggId: number | null
}

export interface BggCollectionItem {
  id: number
  name: string
  yearPublished?: number
  numPlays: number
  userRating?: number
  owned: boolean
  prevOwned: boolean
  wishlist: boolean
  wantToPlay: boolean
  forTrade: boolean
  thumbnailUrl?: string
}
