import {
  ALL_ARTWORKS_QUERY,
  ARTWORK_BY_SLUG_QUERY,
  ARTWORK_SLUGS_QUERY,
  FEATURED_ARTWORKS_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/lib/sanity/queries'

describe('GROQ queries', () => {
  it('selects artwork documents', () => {
    expect(ALL_ARTWORKS_QUERY).toContain('_type == "artwork"')
  })

  it('flattens slug and tag references so components never traverse Sanity internals', () => {
    expect(ALL_ARTWORKS_QUERY).toContain('"slug": slug.current')
    expect(ALL_ARTWORKS_QUERY).toContain('tags[]->')
  })

  it('looks artwork up by slug parameter', () => {
    expect(ARTWORK_BY_SLUG_QUERY).toContain('slug.current == $slug')
  })

  it('returns only slugs for generateStaticParams', () => {
    expect(ARTWORK_SLUGS_QUERY).toContain('slug.current')
    expect(ARTWORK_SLUGS_QUERY).not.toContain('image')
  })

  it('restricts featured artwork to the flagged documents', () => {
    expect(FEATURED_ARTWORKS_QUERY).toContain('isFeatured == true')
  })

  it('reads the site settings singleton by its fixed id', () => {
    expect(SITE_SETTINGS_QUERY).toContain('_id == "siteSettings"')
  })
})
