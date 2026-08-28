import { urlFor } from '@/lib/sanity/imageUrl'
import type { Artwork, SiteSettings } from '@/lib/sanity/types'

const DEFAULT_ARTIST_NAME = 'Zenon Billings'
const DEFAULT_CURRENCY = 'USD'

/**
 * Schema.org VisualArtwork. `dimensions` is deliberately absent: the vocabulary
 * has no free-text size property, and forcing it into width/height would misstate
 * a value like "30 x 40 cm". It is rendered on the page instead.
 */
export function buildArtworkJsonLd(
  artwork: Artwork,
  settings: SiteSettings | null,
  siteUrl: string,
): Record<string, unknown> {
  const offers = artwork.price
    ? {
        '@type': 'Offer',
        price: artwork.price,
        priceCurrency: settings?.priceCurrency ?? DEFAULT_CURRENCY,
        availability: 'https://schema.org/InStock',
      }
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    description: artwork.description ?? undefined,
    artMedium: artwork.medium ?? undefined,
    dateCreated: artwork.yearCreated ?? undefined,
    url: `${siteUrl}/artwork/${artwork.slug}`,
    image: artwork.image ? urlFor(artwork.image).width(1200).url() : undefined,
    creator: { '@type': 'Person', name: settings?.artistName ?? DEFAULT_ARTIST_NAME },
    offers,
  }
}
