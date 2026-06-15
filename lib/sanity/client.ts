import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn:    true,
  // За чернови в реално време (незадължително):
  // token: process.env.SANITY_API_TOKEN,
  // perspective: 'published',
})
