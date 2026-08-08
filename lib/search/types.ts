// Документ в MeiliSearch индекса (плосък обект, без Date и BigInt)
export interface GameDocument {
  id:            string
  bggId:         number | null
  slug:          string
  titleBg:       string
  titleEn:       string | null
  descriptionBg: string | null
  yearPublished: number | null
  minPlayers:    number | null
  maxPlayers:    number | null
  minPlaytime:   number | null
  maxPlaytime:   number | null
  minAge:        number | null
  weight:        number | null
  bggRating:     number | null
  ourRating:     number | null
  thumbnailUrl:  string | null
  imageUrl:      string | null
  categories:    string[]
  mechanics:     string[]
  types:         string[]
  isExpansion:   boolean
}
