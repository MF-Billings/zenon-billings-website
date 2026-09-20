import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlSyncedGalleryBrowser from '@/components/UrlSyncedGalleryBrowser'
import type { Artwork } from '@/lib/sanity/types'

let currentSearch = ''
const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(currentSearch),
  useRouter: () => ({ replace }),
  usePathname: () => '/gallery',
}))

const makeArtwork = (title: string, slug: string, tags: { name: string; slug: string }[]) =>
  ({
    _id: slug,
    title,
    slug,
    image: { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } },
    altText: title,
    tags,
  }) as unknown as Artwork

const artworks = [
  makeArtwork('River in Winter', 'river', [{ name: 'landscape', slug: 'landscape' }]),
  makeArtwork('Portrait of a Friend', 'portrait', [{ name: 'portrait', slug: 'portrait' }]),
]

describe('UrlSyncedGalleryBrowser', () => {
  beforeEach(() => {
    currentSearch = ''
    replace.mockClear()
  })

  it('preselects the tags named in the URL', () => {
    currentSearch = 'tags=portrait'
    render(<UrlSyncedGalleryBrowser artworks={artworks} />)

    expect(screen.getByRole('checkbox', { name: 'portrait' })).toBeChecked()
    expect(screen.queryByText('River in Winter')).not.toBeInTheDocument()
  })

  it('writes the selected tags into the URL without adding history entries', async () => {
    render(<UrlSyncedGalleryBrowser artworks={artworks} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'portrait' }))

    expect(replace).toHaveBeenCalledWith('/gallery?tags=portrait', { scroll: false })
  })

  it('drops the tags parameter once the last tag is deselected', async () => {
    currentSearch = 'tags=portrait'
    render(<UrlSyncedGalleryBrowser artworks={artworks} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'portrait' }))

    expect(replace).toHaveBeenCalledWith('/gallery', { scroll: false })
  })
})
