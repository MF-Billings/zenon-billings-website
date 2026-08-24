import { createClient } from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'nlwxmhc1'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'development'
export const apiVersion = '2026-08-24'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Every read happens at build time, so the cached CDN edge is always the right choice.
  useCdn: true,
})
