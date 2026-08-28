import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GalleryBrowser from '@/components/GalleryBrowser'
import type { Artwork } from '@/lib/sanity/types'

const makeArtwork = (title: string, slug: string, tags: { name: string; slug: string }[]) =>
  ({
    _id: slug,
    title,
    slug,
    medium: 'watercolour',
    image: { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } },
    altText: title,
    yearCreated: 2024,
    tags,
  }) as unknown as Artwork

const artworks = [
  makeArtwork('River in Winter', 'river', [{ name: 'landscape', slug: 'landscape' }]),
  makeArtwork('Portrait of a Friend', 'portrait', [{ name: 'portrait', slug: 'portrait' }]),
]

describe('GalleryBrowser', () => {
  it('shows every artwork before any filtering', () => {
    render(<GalleryBrowser artworks={artworks} />)
    expect(screen.getByText('River in Winter')).toBeInTheDocument()
    expect(screen.getByText('Portrait of a Friend')).toBeInTheDocument()
  })

  it('narrows the grid as the visitor types', async () => {
    render(<GalleryBrowser artworks={artworks} />)

    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'river')

    expect(screen.getByText('River in Winter')).toBeInTheDocument()
    expect(screen.queryByText('Portrait of a Friend')).not.toBeInTheDocument()
  })

  it('narrows the grid when a tag is selected', async () => {
    render(<GalleryBrowser artworks={artworks} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'portrait' }))

    expect(screen.getByText('Portrait of a Friend')).toBeInTheDocument()
    expect(screen.queryByText('River in Winter')).not.toBeInTheDocument()
  })

  it('restores the full grid when the tag is deselected', async () => {
    render(<GalleryBrowser artworks={artworks} />)
    const tag = screen.getByRole('checkbox', { name: 'portrait' })

    await userEvent.click(tag)
    await userEvent.click(tag)

    expect(screen.getByText('River in Winter')).toBeInTheDocument()
    expect(screen.getByText('Portrait of a Friend')).toBeInTheDocument()
  })

  it('explains an empty result rather than showing a blank page', async () => {
    render(<GalleryBrowser artworks={artworks} />)

    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'sculpture')

    expect(screen.getByText(/no artwork matches/i)).toBeInTheDocument()
  })

  it('offers one checkbox per distinct tag', () => {
    render(<GalleryBrowser artworks={artworks} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('reports how many of the total are showing', async () => {
    render(<GalleryBrowser artworks={artworks} />)
    expect(screen.getByRole('status')).toHaveTextContent('2 of 2')

    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'river')
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2')
  })
})
