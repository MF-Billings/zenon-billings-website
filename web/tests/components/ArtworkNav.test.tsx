import { render, screen } from '@testing-library/react'
import ArtworkNav from '@/components/ArtworkNav'
import type { NavigableArtwork } from '@/lib/artwork/adjacentArtworks'

const tag = (slug: string) => ({ name: slug, slug })

const artworks: NavigableArtwork[] = [
  { slug: 'river', title: 'River', tags: [tag('landscape')] },
  { slug: 'portrait', title: 'Portrait', tags: [tag('portrait')] },
  { slug: 'meadow', title: 'Meadow', tags: [tag('landscape')] },
]

const previousButton = () => screen.queryByRole('button', { name: /previous artwork/i })
const nextButton = () => screen.queryByRole('button', { name: /next artwork/i })

describe('ArtworkNav', () => {
  it('links to both neighbours in gallery order', () => {
    render(<ArtworkNav artworks={artworks} currentSlug="portrait" tagSlugs={[]} />)
    expect(previousButton()).toHaveAttribute('href', '/artwork/river')
    expect(nextButton()).toHaveAttribute('href', '/artwork/meadow')
  })

  it('omits the previous button on the first artwork', () => {
    render(<ArtworkNav artworks={artworks} currentSlug="river" tagSlugs={[]} />)
    expect(previousButton()).not.toBeInTheDocument()
    expect(nextButton()).toBeInTheDocument()
  })

  it('omits the next button on the last artwork', () => {
    render(<ArtworkNav artworks={artworks} currentSlug="meadow" tagSlugs={[]} />)
    expect(previousButton()).toBeInTheDocument()
    expect(nextButton()).not.toBeInTheDocument()
  })

  it('walks the tag-filtered set and keeps the filter in the link', () => {
    render(<ArtworkNav artworks={artworks} currentSlug="river" tagSlugs={['landscape']} />)
    expect(previousButton()).not.toBeInTheDocument()
    expect(nextButton()).toHaveAttribute('href', '/artwork/meadow?tags=landscape')
  })

  it('names the destination for screen readers', () => {
    render(<ArtworkNav artworks={artworks} currentSlug="portrait" tagSlugs={[]} />)
    expect(screen.getByRole('button', { name: 'Previous artwork: River' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next artwork: Meadow' })).toBeInTheDocument()
  })

  it('renders nothing when the artwork stands alone', () => {
    const { container } = render(
      <ArtworkNav artworks={[artworks[0]]} currentSlug="river" tagSlugs={[]} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
