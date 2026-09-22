'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { ReactNode } from 'react'
import ArtworkLightbox from '@/components/ArtworkLightbox'
import { artworkPath } from '@/lib/artwork/artworkPath'
import {
  lightboxSlides,
  type LightboxArtwork,
  type LightboxSlide,
} from '@/lib/artwork/lightboxSlides'
import { parseTagSlugs, withTagSlugs } from '@/lib/gallery/filterQuery'

type UrlSyncedArtworkLightboxProps = {
  collection: LightboxArtwork[]
  currentSlug: string
  children: ReactNode
}

// Reads the gallery's tag filter from the URL so the lightbox walks the same
// subset the visitor was browsing. Kept apart from ArtworkLightbox so the page
// can prerender the unfiltered lightbox as its Suspense fallback.
export default function UrlSyncedArtworkLightbox({
  collection,
  currentSlug,
  children,
}: UrlSyncedArtworkLightboxProps) {
  const router = useRouter()
  const tagSlugs = parseTagSlugs(useSearchParams())
  const { slides, startIndex } = lightboxSlides(collection, currentSlug, tagSlugs)

  // The placard describes one painting; if the visitor closed on another, the
  // page follows them there. Push, not replace, so Back returns to where they
  // started browsing.
  const followTo = (slide: LightboxSlide) =>
    router.push(withTagSlugs(artworkPath(slide.slug), tagSlugs))

  return (
    <ArtworkLightbox slides={slides} startIndex={startIndex} onLeaveAt={followTo}>
      {children}
    </ArtworkLightbox>
  )
}
