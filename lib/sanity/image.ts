import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { sanityClient } from './client'

const builder = createImageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
