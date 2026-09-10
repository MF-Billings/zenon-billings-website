import { render, screen } from '@testing-library/react'
import ArtworkCard from '@/components/ArtworkCard'
import { CARD_ASPECT_RATIO } from '@/lib/artwork/cardAspectRatio'
import type { Artwork } from '@/lib/sanity/types'

const artwork = {
  _id: 'artwork-1',
  title: 'Autumn Landscape',
  slug: 'autumn-landscape',
  description: 'A study in ochre.',
  medium: 'watercolour',
  image: { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } },
  altText: 'Trees in autumn colours beside a river',
  dimensions: { width: 30, height: 40, unit: 'cm' },
  yearCreated: 2024,
  isFeatured: false,
  price: null,
  tags: [{ _id: 'tag-1', name: 'landscape', slug: 'landscape', category: null }],
} as unknown as Artwork

describe('ArtworkCard', () => {
  it('links to the artwork detail page', () => {
    render(<ArtworkCard artwork={artwork} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/artwork/autumn-landscape')
  })

  it('shows the title and the year', () => {
    render(<ArtworkCard artwork={artwork} />)
    expect(screen.getByText('Autumn Landscape')).toBeInTheDocument()
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('uses the artwork alt text rather than the title, so the image is described', () => {
    render(<ArtworkCard artwork={artwork} />)
    expect(
      screen.getByRole('img', { name: 'Trees in autumn colours beside a river' }),
    ).toBeInTheDocument()
  })

  it('omits the year line entirely when the year is unknown', () => {
    render(<ArtworkCard artwork={{ ...artwork, yearCreated: null } as Artwork} />)
    expect(screen.queryByText(/2024/)).not.toBeInTheDocument()
  })

  it('falls back to the title for alt text when altText is missing', () => {
    render(<ArtworkCard artwork={{ ...artwork, altText: null } as Artwork} />)
    expect(screen.getByRole('img', { name: 'Autumn Landscape' })).toBeInTheDocument()
  })

  it('mats the image so every card is the same shape regardless of the artwork', () => {
    const { container } = render(<ArtworkCard artwork={artwork} />)
    expect(container.querySelector('.artwork-card__mat')).toBeInTheDocument()
  })

  it('crops every thumbnail to the mat ratio so the image fills its mat regardless of source shape', () => {
    render(<ArtworkCard artwork={artwork} />)

    const img = screen.getByRole('img')
    expect(img.getAttribute('src')).toMatch(/fit=crop/)
    const width = Number(img.getAttribute('width'))
    const height = Number(img.getAttribute('height'))
    expect(width / height).toBeCloseTo(CARD_ASPECT_RATIO, 2)
  })

  it('shows the full studio label, not just the year', () => {
    render(<ArtworkCard artwork={artwork} />)
    expect(screen.getByText('watercolour')).toBeInTheDocument()
    expect(screen.getByText('30 × 40 cm')).toBeInTheDocument()
  })
})
