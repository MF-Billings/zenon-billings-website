import { render, screen } from '@testing-library/react'
import ArtworkGrid from '@/components/ArtworkGrid'
import type { Artwork } from '@/lib/sanity/types'

const makeArtwork = (title: string, slug: string) =>
  ({
    _id: slug,
    title,
    slug,
    medium: 'watercolour',
    image: { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } },
    altText: title,
    yearCreated: 2024,
    tags: [],
  }) as unknown as Artwork

describe('ArtworkGrid', () => {
  it('renders one card per artwork', () => {
    render(<ArtworkGrid artworks={[makeArtwork('One', 'one'), makeArtwork('Two', 'two')]} />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('lets the caller decide where each card links', () => {
    render(
      <ArtworkGrid
        artworks={[makeArtwork('One', 'one')]}
        hrefFor={(artwork) => `/artwork/${artwork.slug}?tags=landscape`}
      />,
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/artwork/one?tags=landscape')
  })

  it('tells the visitor when there is nothing to show', () => {
    render(<ArtworkGrid artworks={[]} />)
    expect(screen.getByText(/no artwork/i)).toBeInTheDocument()
  })

  it('uses a caller-supplied empty message when given one', () => {
    render(<ArtworkGrid artworks={[]} emptyMessage="Nothing matches that search." />)
    expect(screen.getByText('Nothing matches that search.')).toBeInTheDocument()
  })
})
