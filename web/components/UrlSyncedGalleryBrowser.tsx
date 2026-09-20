'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import GalleryBrowser, { type GalleryBrowserProps } from '@/components/GalleryBrowser'
import { parseTagSlugs, withTagSlugs } from '@/lib/gallery/filterQuery'

// Mirrors the tag filter into the URL so it survives the trip to an artwork page and
// back. Kept apart from GalleryBrowser so the page can prerender the unfiltered grid
// as its Suspense fallback.
export default function UrlSyncedGalleryBrowser({
  artworks,
}: Pick<GalleryBrowserProps, 'artworks'>) {
  const router = useRouter()
  const pathname = usePathname()
  const initialTagSlugs = parseTagSlugs(useSearchParams())

  // Replace rather than push: each toggle is a refinement, not a new place to go back to.
  const syncToUrl = (tagSlugs: string[]) =>
    router.replace(withTagSlugs(pathname, tagSlugs), { scroll: false })

  return (
    <GalleryBrowser
      artworks={artworks}
      initialTagSlugs={initialTagSlugs}
      onTagSlugsChange={syncToUrl}
    />
  )
}
