'use client'

import { useSearchParams } from 'next/navigation'
import ArtworkNav, { type ArtworkNavProps } from '@/components/ArtworkNav'
import { parseTagSlugs } from '@/lib/gallery/filterQuery'

// Reads the gallery's tag filter from the URL so prev/next walk the same subset the
// visitor was browsing. Kept apart from ArtworkNav so the page can prerender the
// unfiltered navigation as its Suspense fallback.
export default function UrlSyncedArtworkNav(props: Omit<ArtworkNavProps, 'tagSlugs'>) {
  return <ArtworkNav {...props} tagSlugs={parseTagSlugs(useSearchParams())} />
}
