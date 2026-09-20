import { parseTagSlugs, TAGS_PARAM, withTagSlugs } from '@/lib/gallery/filterQuery'

describe('parseTagSlugs', () => {
  it('reads comma-separated slugs from the tags parameter', () => {
    expect(parseTagSlugs(new URLSearchParams('tags=landscape,portrait'))).toEqual([
      'landscape',
      'portrait',
    ])
  })

  it('returns no slugs when the parameter is absent', () => {
    expect(parseTagSlugs(new URLSearchParams(''))).toEqual([])
  })

  it('drops empty entries left by stray commas', () => {
    expect(parseTagSlugs(new URLSearchParams('tags=,landscape,,'))).toEqual(['landscape'])
  })

  it('tolerates a null params object, as useSearchParams may hand over', () => {
    expect(parseTagSlugs(null)).toEqual([])
  })
})

describe('withTagSlugs', () => {
  it('appends the tags parameter to a path', () => {
    expect(withTagSlugs('/artwork/river', ['landscape', 'portrait'])).toBe(
      '/artwork/river?tags=landscape%2Cportrait',
    )
  })

  it('leaves the path untouched when no tags are selected', () => {
    expect(withTagSlugs('/artwork/river', [])).toBe('/artwork/river')
  })

  it('names the parameter through one shared constant', () => {
    expect(TAGS_PARAM).toBe('tags')
  })
})
