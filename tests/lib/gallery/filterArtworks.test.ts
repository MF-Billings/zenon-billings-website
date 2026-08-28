import { collectTags, EMPTY_FILTER, filterArtworks } from '@/lib/gallery/filterArtworks'

const river = {
  title: 'River in Winter',
  tags: [
    { name: 'landscape', slug: 'landscape' },
    { name: 'winter-project', slug: 'winter-project' },
  ],
}
const portrait = { title: 'Portrait of a Friend', tags: [{ name: 'portrait', slug: 'portrait' }] }
const untagged = { title: 'Untitled Study', tags: null }
const artworks = [river, portrait, untagged]

describe('filterArtworks', () => {
  it('returns everything when nothing is filtered', () => {
    expect(filterArtworks(artworks, EMPTY_FILTER)).toEqual(artworks)
  })

  it('preserves the incoming order', () => {
    expect(filterArtworks(artworks, EMPTY_FILTER).map((a) => a.title)).toEqual([
      'River in Winter',
      'Portrait of a Friend',
      'Untitled Study',
    ])
  })

  it('matches a title substring regardless of case', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, searchTerm: 'WINTER' })).toEqual([river])
  })

  it('matches a tag name substring', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, searchTerm: 'landsc' })).toEqual([river])
  })

  it('treats a whitespace-only search as no search', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, searchTerm: '   ' })).toEqual(artworks)
  })

  it('returns nothing when the search matches nothing', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, searchTerm: 'sculpture' })).toEqual([])
  })

  it('keeps artwork carrying any of the selected tags', () => {
    const filtered = filterArtworks(artworks, {
      ...EMPTY_FILTER,
      tagSlugs: ['portrait', 'landscape'],
    })
    expect(filtered).toEqual([river, portrait])
  })

  it('excludes untagged artwork once any tag is selected', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, tagSlugs: ['landscape'] })).toEqual([river])
  })

  it('requires both the search and the tag to match when both are active', () => {
    expect(filterArtworks(artworks, { searchTerm: 'river', tagSlugs: ['portrait'] })).toEqual([])
    expect(filterArtworks(artworks, { searchTerm: 'river', tagSlugs: ['landscape'] })).toEqual([
      river,
    ])
  })

  it('tolerates a null title', () => {
    const nameless = { title: null, tags: null }
    expect(filterArtworks([nameless], { ...EMPTY_FILTER, searchTerm: 'x' })).toEqual([])
  })
})

describe('collectTags', () => {
  it('returns each distinct tag once, sorted by name', () => {
    expect(collectTags(artworks)).toEqual([
      { name: 'landscape', slug: 'landscape' },
      { name: 'portrait', slug: 'portrait' },
      { name: 'winter-project', slug: 'winter-project' },
    ])
  })

  it('handles artwork with no tags', () => {
    expect(collectTags([untagged])).toEqual([])
  })

  it('deduplicates a tag shared by several artworks', () => {
    const shared = { title: 'Another', tags: [{ name: 'landscape', slug: 'landscape' }] }
    expect(collectTags([river, shared]).filter((t) => t.slug === 'landscape')).toHaveLength(1)
  })
})
