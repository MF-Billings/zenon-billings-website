import { urlFor } from '@/lib/sanity/imageUrl'
import type { Artwork, SiteSettings } from '@/lib/sanity/types'

const DEFAULT_CURRENCY = 'USD'

type DimensionUnit = NonNullable<NonNullable<Artwork['dimensions']>['unit']>

// UN/CEFACT Common Codes, which is what Schema.org's unitCode expects.
const UNIT_CODES: Record<DimensionUnit, string> = {
  cm: 'CMT',
  in: 'INH',
}

function toQuantitativeValue(
  value: number | undefined | null,
  unit: DimensionUnit | undefined | null,
) {
  if (typeof value !== 'number' || !unit) return undefined

  return {
    '@type': 'QuantitativeValue',
    value,
    unitCode: UNIT_CODES[unit],
    unitText: unit,
  }
}

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

  const unit = artwork.dimensions?.unit

  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    description: artwork.description ?? undefined,
    artMedium: artwork.medium ?? undefined,
    dateCreated: artwork.yearCreated ?? undefined,
    url: `${siteUrl}/artwork/${artwork.slug}`,
    image: artwork.image ? urlFor(artwork.image).width(1200).url() : undefined,
    creator: { '@type': 'Person', name: 'Zenon Billings' },
    width: toQuantitativeValue(artwork.dimensions?.width, unit),
    height: toQuantitativeValue(artwork.dimensions?.height, unit),
    offers,
  }
}
