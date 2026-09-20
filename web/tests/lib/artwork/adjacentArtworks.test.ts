import { findAdjacentArtworks, type NavigableArtwork } from '@/lib/artwork/adjacentArtworks'

const tag = (slug: string) => ({ name: slug, slug })

const river: NavigableArtwork = { slug: 'river', title: 'River', tags: [tag('landscape')] }
const portrait: NavigableArtwork = { slug: 'portrait', title: 'Portrait', tags: [tag('portrait')] }
const meadow: NavigableArtwork = { slug: 'meadow', title: 'Meadow', tags: [tag('landscape')] }
const untagged: NavigableArtwork = { slug: 'study', title: 'Study', tags: null }
const ordered = [river, portrait, meadow, untagged]

describe('findAdjacentArtworks', () => {
  it('returns the neighbours in collection order', () => {
    expect(findAdjacentArtworks(ordered, 'portrait', [])).toEqual({
      previous: river,
      next: meadow,
    })
  })

  it('has no previous for the first artwork', () => {
    expect(findAdjacentArtworks(ordered, 'river', []).previous).toBeNull()
  })

  it('has no next for the last artwork', () => {
    expect(findAdjacentArtworks(ordered, 'study', []).next).toBeNull()
  })

  it('walks only the artwork carrying a selected tag', () => {
    expect(findAdjacentArtworks(ordered, 'river', ['landscape'])).toEqual({
      previous: null,
      next: meadow,
    })
  })

  it('falls back to the whole collection when the current artwork is outside the tag set', () => {
    expect(findAdjacentArtworks(ordered, 'portrait', ['landscape'])).toEqual({
      previous: river,
      next: meadow,
    })
  })

  it('offers nothing when the current artwork is not in the collection at all', () => {
    expect(findAdjacentArtworks(ordered, 'missing', [])).toEqual({ previous: null, next: null })
  })
})
