import { render, screen } from '@testing-library/react'
import UrlSyncedArtworkNav from '@/components/UrlSyncedArtworkNav'
import type { NavigableArtwork } from '@/lib/artwork/adjacentArtworks'

let currentSearch = ''

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(currentSearch),
}))

const tag = (slug: string) => ({ name: slug, slug })

const artworks: NavigableArtwork[] = [
  { slug: 'river', title: 'River', tags: [tag('landscape')] },
  { slug: 'portrait', title: 'Portrait', tags: [tag('portrait')] },
  { slug: 'meadow', title: 'Meadow', tags: [tag('landscape')] },
]

describe('UrlSyncedArtworkNav', () => {
  beforeEach(() => {
    currentSearch = ''
  })

  it('walks the whole collection when the URL names no tags', () => {
    render(<UrlSyncedArtworkNav artworks={artworks} currentSlug="river" />)
    expect(screen.getByRole('button', { name: /next artwork/i })).toHaveAttribute(
      'href',
      '/artwork/portrait',
    )
  })

  it('walks the tag set named in the URL', () => {
    currentSearch = 'tags=landscape'
    render(<UrlSyncedArtworkNav artworks={artworks} currentSlug="river" />)
    expect(screen.getByRole('button', { name: /next artwork/i })).toHaveAttribute(
      'href',
      '/artwork/meadow?tags=landscape',
    )
  })
})
