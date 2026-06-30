import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID не е зададен')

export const sanityClient = createClient({
  projectId,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn:    process.env.NODE_ENV === 'production',
})
