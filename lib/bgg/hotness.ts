import { unstable_cache } from 'next/cache'
import { fetchBGGHotness } from './client'

export const getHotness = unstable_cache(
  () => fetchBGGHotness(),
  ['bgg-hotness'],
  { revalidate: 604800 }
)
