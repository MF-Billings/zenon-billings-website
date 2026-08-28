export type FilterableTag = { name: string | null; slug: string | null }
export type FilterableArtwork = { title: string | null; tags: FilterableTag[] | null }

export type ArtworkFilter = {
  searchTerm: string
  tagSlugs: string[]
}

export const EMPTY_FILTER: ArtworkFilter = { searchTerm: '', tagSlugs: [] }

function matchesSearch(artwork: FilterableArtwork, searchTerm: string): boolean {
  const needle = searchTerm.trim().toLowerCase()
  if (!needle) return true

  const haystack = [artwork.title, ...(artwork.tags ?? []).map((tag) => tag.name)]
  return haystack.some((value) => value?.toLowerCase().includes(needle) ?? false)
}

function matchesTags(artwork: FilterableArtwork, tagSlugs: string[]): boolean {
  if (tagSlugs.length === 0) return true
  return (artwork.tags ?? []).some((tag) => tag.slug !== null && tagSlugs.includes(tag.slug))
}

export function filterArtworks<T extends FilterableArtwork>(
  artworks: T[],
  filter: ArtworkFilter,
): T[] {
  return artworks.filter(
    (artwork) => matchesSearch(artwork, filter.searchTerm) && matchesTags(artwork, filter.tagSlugs),
  )
}

export function collectTags<T extends FilterableArtwork>(artworks: T[]): FilterableTag[] {
  const bySlug = new Map<string, FilterableTag>()

  for (const artwork of artworks) {
    for (const tag of artwork.tags ?? []) {
      if (tag.slug) bySlug.set(tag.slug, tag)
    }
  }

  return [...bySlug.values()].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
}
