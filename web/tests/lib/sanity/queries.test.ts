import {
  ALL_ARTWORKS_QUERY,
  ARTWORK_BY_SLUG_QUERY,
  ARTWORK_NAVIGATION_QUERY,
  ARTWORK_ORDER,
  ARTWORK_SLUGS_QUERY,
  FEATURED_ARTWORKS_QUERY,
  LIFE_EVENTS_QUERY,
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

  it('carries the artist note alongside the description', () => {
    expect(ALL_ARTWORKS_QUERY).toContain('artistNote')
    expect(ARTWORK_BY_SLUG_QUERY).toContain('artistNote')
  })

  it('carries the display width cap and the native pixel width so weak scans are never stretched', () => {
    for (const query of [ALL_ARTWORKS_QUERY, FEATURED_ARTWORKS_QUERY, ARTWORK_BY_SLUG_QUERY]) {
      expect(query).toContain('displayMaxWidth')
      expect(query).toContain('"imageWidth": image.asset->metadata.dimensions.width')
    }
  })

  it('orders the gallery alphabetically by title regardless of year or case', () => {
    expect(ALL_ARTWORKS_QUERY).toContain('order(lower(title) asc)')
    expect(ALL_ARTWORKS_QUERY).not.toContain('yearCreated, 0) desc')
  })

  it('looks artwork up by slug parameter', () => {
    expect(ARTWORK_BY_SLUG_QUERY).toContain('slug.current == $slug')
  })

  it('returns only slugs for generateStaticParams', () => {
    expect(ARTWORK_SLUGS_QUERY).toContain('slug.current')
    expect(ARTWORK_SLUGS_QUERY).not.toContain('image')
  })

  it('walks artwork in exactly the gallery order, so prev/next never disagree with the grid', () => {
    expect(ARTWORK_NAVIGATION_QUERY).toContain(ARTWORK_ORDER)
    expect(ALL_ARTWORKS_QUERY).toContain(ARTWORK_ORDER)
  })

  it('keeps the navigation list light: slugs and tags only, no image or prose', () => {
    expect(ARTWORK_NAVIGATION_QUERY).toContain('"slug": slug.current')
    expect(ARTWORK_NAVIGATION_QUERY).toContain('tags[]->')
    expect(ARTWORK_NAVIGATION_QUERY).not.toContain('image')
    expect(ARTWORK_NAVIGATION_QUERY).not.toContain('description')
  })

  it('restricts featured artwork to the flagged documents', () => {
    expect(FEATURED_ARTWORKS_QUERY).toContain('isFeatured == true')
  })

  it('reads the site settings singleton by its fixed id', () => {
    expect(SITE_SETTINGS_QUERY).toContain('_id == "siteSettings"')
  })

  it('publishes only the disposable contact alias, never a personal inbox field', () => {
    expect(SITE_SETTINGS_QUERY).toContain('publicContactAlias')
    expect(SITE_SETTINGS_QUERY).not.toContain('contactEmail')
  })

  it('selects dated life events in chronological order, then by editor sort order', () => {
    expect(LIFE_EVENTS_QUERY).toContain('_type == "lifeEvent"')
    expect(LIFE_EVENTS_QUERY).toContain('defined(date)')
    expect(LIFE_EVENTS_QUERY).toContain(
      'order(date asc, coalesce(sortOrder, 0) asc, _createdAt asc)',
    )
  })

  it('carries everything the timeline renders and nothing it does not', () => {
    for (const field of [
      'title',
      'date',
      'datePrecision',
      'endDate',
      'summary',
      'image',
      'altText',
    ]) {
      expect(LIFE_EVENTS_QUERY).toContain(field)
    }
    const projection = LIFE_EVENTS_QUERY.slice(LIFE_EVENTS_QUERY.lastIndexOf('{'))
    expect(projection).not.toContain('sortOrder')
  })
})
