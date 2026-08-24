export type ArtworkMedium = 'watercolour' | 'drawing' | 'photography' | 'other'

export type MetObject = {
  objectID: number
  title: string
  objectDate: string
  medium: string
  dimensions: string
  primaryImage: string
  artistDisplayName: string
  isPublicDomain: boolean
  tags: { term: string }[] | null
}

export type SeedArtwork = {
  title: string
  slug: string
  medium: ArtworkMedium
  dimensions: string
  yearCreated: number | undefined
  altText: string
  description: string
  imageUrl: string
  tagNames: string[]
}

const MEDIUM_PATTERNS: [RegExp, ArtworkMedium][] = [
  [/watercolou?r|gouache/i, 'watercolour'],
  [/photograph|albumen|gelatin silver|daguerreotype/i, 'photography'],
  [/drawing|graphite|charcoal|chalk|pen and|ink|pastel/i, 'drawing'],
]

export function toMedium(metMedium: string): ArtworkMedium {
  const match = MEDIUM_PATTERNS.find(([pattern]) => pattern.test(metMedium))
  return match ? match[1] : 'other'
}

export function toYearCreated(objectDate: string): number | undefined {
  const year = objectDate.match(/\d{4}/)
  return year ? Number(year[0]) : undefined
}

export function toSlug(title: string, objectId: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${objectId}`
}

// The tag schema permits letters and hyphens only, so anything else is dropped
// rather than mangled into a tag nobody would search for.
const isUsableTagName = (name: string) => /^[a-z-]+$/.test(name)

export function toSeedArtwork(object: MetObject): SeedArtwork | null {
  if (!object.primaryImage || !object.isPublicDomain) return null

  return {
    title: object.title,
    slug: toSlug(object.title, object.objectID),
    medium: toMedium(object.medium),
    dimensions: object.dimensions,
    yearCreated: toYearCreated(object.objectDate),
    altText: `${object.title} by ${object.artistDisplayName || 'an unknown artist'}`,
    description: `${object.medium}. Sample data from the Met Museum Open Access collection.`,
    imageUrl: object.primaryImage,
    tagNames: (object.tags ?? []).map(({ term }) => term.toLowerCase()).filter(isUsableTagName),
  }
}

export function assertSeedableDataset(dataset: string): void {
  if (dataset === 'production') {
    throw new Error(
      'Refusing to seed the production dataset — it holds real artwork. Set NEXT_PUBLIC_SANITY_DATASET=development.',
    )
  }
}
