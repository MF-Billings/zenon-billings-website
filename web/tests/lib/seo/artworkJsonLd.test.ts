import { buildArtworkJsonLd } from '@/lib/seo/artworkJsonLd'
import type { Artwork, SiteSettings } from '@/lib/sanity/types'

const artwork = {
  _id: 'artwork-1',
  title: 'Autumn Landscape',
  slug: 'autumn-landscape',
  description: 'A study in ochre.',
  medium: 'watercolour',
  image: { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } },
  altText: 'Trees in autumn',
  dimensions: '30 x 40 cm',
  yearCreated: 2024,
  isFeatured: false,
  price: null,
  tags: [],
} as unknown as Artwork

const settings = { artistName: 'Zenon Billings', priceCurrency: 'USD' } as SiteSettings

describe('buildArtworkJsonLd', () => {
  it('describes the artwork as a Schema.org VisualArtwork', () => {
    const jsonLd = buildArtworkJsonLd(artwork, settings, 'https://example.com')

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('VisualArtwork')
    expect(jsonLd.name).toBe('Autumn Landscape')
    expect(jsonLd.artMedium).toBe('watercolour')
    expect(jsonLd.dateCreated).toBe(2024)
  })

  it('credits the artist from site settings', () => {
    const jsonLd = buildArtworkJsonLd(artwork, settings, 'https://example.com')
    expect(jsonLd.creator).toEqual({ '@type': 'Person', name: 'Zenon Billings' })
  })

  it('points at the canonical url for this artwork', () => {
    const jsonLd = buildArtworkJsonLd(artwork, settings, 'https://example.com')
    expect(jsonLd.url).toBe('https://example.com/artwork/autumn-landscape')
  })

  it('includes an absolute CDN image url', () => {
    const jsonLd = buildArtworkJsonLd(artwork, settings, 'https://example.com')
    expect(jsonLd.image).toContain('cdn.sanity.io')
  })

  it('omits offers when the artwork has no price', () => {
    expect(buildArtworkJsonLd(artwork, settings, 'https://example.com').offers).toBeUndefined()
  })

  it('adds an offer in the configured currency when priced', () => {
    const priced = { ...artwork, price: 250 } as Artwork
    expect(buildArtworkJsonLd(priced, settings, 'https://example.com').offers).toEqual({
      '@type': 'Offer',
      price: 250,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    })
  })

  it('falls back to USD when site settings are missing', () => {
    const priced = { ...artwork, price: 250 } as Artwork
    const offers = buildArtworkJsonLd(priced, null, 'https://example.com').offers as
      Record<string, unknown> | undefined
    expect(offers?.priceCurrency).toBe('USD')
  })

  it('falls back to the site name when settings have no artist name', () => {
    const jsonLd = buildArtworkJsonLd(artwork, null, 'https://example.com')
    expect(jsonLd.creator).toEqual({ '@type': 'Person', name: 'Zenon Billings' })
  })

  it('emits valid JSON that a crawler can parse', () => {
    const serialised = JSON.stringify(buildArtworkJsonLd(artwork, settings, 'https://example.com'))
    expect(() => JSON.parse(serialised)).not.toThrow()
    expect(JSON.parse(serialised)['@type']).toBe('VisualArtwork')
  })
})
