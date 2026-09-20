import { artworkPath } from '@/lib/artwork/artworkPath'

describe('artworkPath', () => {
  it('builds the detail route for a slug', () => {
    expect(artworkPath('river-in-winter')).toBe('/artwork/river-in-winter')
  })
})
