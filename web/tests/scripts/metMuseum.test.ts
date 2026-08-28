import {
  assertSeedableDataset,
  toDimensions,
  toMedium,
  toSeedArtwork,
  toSlug,
  toYearCreated,
} from '@/scripts/metMuseum'

describe('toMedium', () => {
  it.each([
    ['Watercolor on off-white wove paper', 'watercolour'],
    ['Watercolour and gouache', 'watercolour'],
    ['Gelatin silver print', 'photography'],
    ['Albumen photograph', 'photography'],
    ['Graphite on paper', 'drawing'],
    ['Pen and brown ink', 'drawing'],
    ['Bronze', 'other'],
  ])('maps %s to %s', (metMedium, expected) => {
    expect(toMedium(metMedium)).toBe(expected)
  })

  it('falls back to other for an empty medium', () => {
    expect(toMedium('')).toBe('other')
  })
})

describe('toYearCreated', () => {
  it.each([
    ['1856', 1856],
    ['ca. 1870', 1870],
    ['1863–65', 1863],
    ['dated 1901', 1901],
  ])('reads the first four-digit year from %s', (objectDate, expected) => {
    expect(toYearCreated(objectDate)).toBe(expected)
  })

  it('returns undefined when there is no year to read', () => {
    expect(toYearCreated('n.d.')).toBeUndefined()
  })
})

describe('toSlug', () => {
  it('lowercases, hyphenates, and suffixes the Met object id for uniqueness', () => {
    expect(toSlug('View of the Hudson River', 12345)).toBe('view-of-the-hudson-river-12345')
  })

  it('strips punctuation rather than encoding it', () => {
    expect(toSlug('A Study, No. 3 (Autumn)', 7)).toBe('a-study-no-3-autumn-7')
  })
})

describe('toSeedArtwork', () => {
  const metObject = {
    objectID: 42,
    title: 'Autumn Landscape',
    objectDate: 'ca. 1885',
    medium: 'Watercolor on paper',
    dimensions: '30 × 40 cm',
    primaryImage: 'https://images.metmuseum.org/full/42.jpg',
    artistDisplayName: 'Anonymous',
    isPublicDomain: true,
    tags: [{ term: 'Landscapes' }, { term: 'Trees' }],
  }

  it('maps a Met object onto our artwork shape', () => {
    expect(toSeedArtwork(metObject)).toEqual({
      title: 'Autumn Landscape',
      slug: 'autumn-landscape-42',
      medium: 'watercolour',
      dimensions: { width: 40, height: 30, unit: 'cm' },
      yearCreated: 1885,
      altText: 'Autumn Landscape by Anonymous',
      description: 'Watercolor on paper. Sample data from the Met Museum Open Access collection.',
      imageUrl: 'https://images.metmuseum.org/full/42.jpg',
      tagNames: ['landscapes', 'trees'],
    })
  })

  it('rejects objects with no image, since an artwork without one is unusable', () => {
    expect(toSeedArtwork({ ...metObject, primaryImage: '' })).toBeNull()
  })

  it('rejects objects that are not public domain', () => {
    expect(toSeedArtwork({ ...metObject, isPublicDomain: false })).toBeNull()
  })

  it('drops tag terms that are not plain letters and hyphens', () => {
    const withAwkwardTags = {
      ...metObject,
      tags: [{ term: 'Men' }, { term: 'Saint Peter, 1st c.' }],
    }
    expect(toSeedArtwork(withAwkwardTags)?.tagNames).toEqual(['men'])
  })

  it('names an unknown artist rather than leaving the alt text dangling', () => {
    expect(toSeedArtwork({ ...metObject, artistDisplayName: '' })?.altText).toBe(
      'Autumn Landscape by an unknown artist',
    )
  })

  it('tolerates a null tags array', () => {
    expect(toSeedArtwork({ ...metObject, tags: null })?.tagNames).toEqual([])
  })
})

describe('toDimensions', () => {
  it('reads a plain centimetre pair', () => {
    // The Met lists height first, so the leading number is the height.
    expect(toDimensions('30 × 40 cm')).toEqual({ height: 30, width: 40, unit: 'cm' })
  })

  it('prefers the parenthesised metric values over imperial with fractions', () => {
    expect(toDimensions('Sheet: 12 1/2 × 19 in. (31.8 × 48.3 cm)')).toEqual({
      height: 31.8,
      width: 48.3,
      unit: 'cm',
    })
  })

  it('accepts a plain letter x as the separator', () => {
    expect(toDimensions('20 x 25 cm')).toEqual({ height: 20, width: 25, unit: 'cm' })
  })

  it('falls back to inches when no metric value is given', () => {
    expect(toDimensions('9 × 13 in.')).toEqual({ height: 9, width: 13, unit: 'in' })
  })

  it('ignores a label before the measurement', () => {
    expect(toDimensions('Image: 15.2 × 20.3 cm')).toEqual({ height: 15.2, width: 20.3, unit: 'cm' })
  })

  it('returns null when nothing parseable is present', () => {
    expect(toDimensions('')).toBeNull()
    expect(toDimensions('irregular')).toBeNull()
    expect(toDimensions('overall dimensions unknown')).toBeNull()
  })
})

describe('assertSeedableDataset', () => {
  it('allows the development dataset', () => {
    expect(() => assertSeedableDataset('development')).not.toThrow()
  })

  it('refuses to touch production, which holds the artist real content', () => {
    expect(() => assertSeedableDataset('production')).toThrow(/production/i)
  })
})
