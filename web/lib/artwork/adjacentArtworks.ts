import { EMPTY_FILTER, filterArtworks, type FilterableArtwork } from '@/lib/gallery/filterArtworks'

export type NavigableArtwork = FilterableArtwork & { slug: string | null }

export type AdjacentArtworks<T> = { previous: T | null; next: T | null }

function neighboursWithin<T extends NavigableArtwork>(
  collection: T[],
  currentSlug: string,
): AdjacentArtworks<T> | null {
  const index = collection.findIndex((artwork) => artwork.slug === currentSlug)
  if (index === -1) return null

  return {
    previous: collection[index - 1] ?? null,
    next: collection[index + 1] ?? null,
  }
}

export function findAdjacentArtworks<T extends NavigableArtwork>(
  ordered: T[],
  currentSlug: string,
  tagSlugs: string[],
): AdjacentArtworks<T> {
  const tagged = filterArtworks(ordered, { ...EMPTY_FILTER, tagSlugs })

  return (
    neighboursWithin(tagged, currentSlug) ??
    neighboursWithin(ordered, currentSlug) ?? { previous: null, next: null }
  )
}
