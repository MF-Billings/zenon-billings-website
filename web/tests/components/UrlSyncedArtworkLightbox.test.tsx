import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UrlSyncedArtworkLightbox from '@/components/UrlSyncedArtworkLightbox'
import type { LightboxArtwork } from '@/lib/artwork/lightboxSlides'

let currentSearch = ''
const push = vi.fn()

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(currentSearch),
  useRouter: () => ({ push }),
}))

const fake = { options: null as Record<string, unknown> | null, close: () => {}, currIndex: 0 }

vi.mock('photoswipe/lightbox', () => ({
  default: class {
    pswp = fake
    constructor(options: Record<string, unknown>) {
      fake.options = options
    }
    init() {}
    on(name: string, handler: () => void) {
      if (name === 'close') fake.close = handler
    }
    loadAndOpen(index: number) {
      fake.currIndex = index
      return true
    }
    destroy() {}
  },
}))

const tag = (slug: string) => ({ name: slug, slug })
const make = (slug: string, tagSlugs: string[]): LightboxArtwork => ({
  slug,
  title: slug,
  tags: tagSlugs.map(tag),
  image: { _type: 'image', asset: { _ref: `image-${slug}-4000x3000-jpg`, _type: 'reference' } },
  imageWidth: 4000,
  imageHeight: 3000,
  altText: null,
  displayMaxWidth: null,
})
const collection = [
  make('river', ['landscape']),
  make('portrait', ['portrait']),
  make('meadow', ['landscape']),
]

const slugsOf = (options: Record<string, unknown> | null) =>
  (options?.dataSource as { slug: string }[]).map((slide) => slide.slug)

describe('UrlSyncedArtworkLightbox', () => {
  beforeEach(() => {
    currentSearch = ''
    push.mockClear()
    fake.options = null
  })

  it('offers the whole collection when the URL names no tags', async () => {
    render(
      <UrlSyncedArtworkLightbox collection={collection} currentSlug="river">
        <span>picture</span>
      </UrlSyncedArtworkLightbox>,
    )
    await userEvent.click(screen.getByRole('link'))

    await waitFor(() => expect(fake.options).not.toBeNull())
    expect(slugsOf(fake.options)).toEqual(['river', 'portrait', 'meadow'])
  })

  it('offers only the tagged set named in the URL', async () => {
    currentSearch = 'tags=landscape'
    render(
      <UrlSyncedArtworkLightbox collection={collection} currentSlug="river">
        <span>picture</span>
      </UrlSyncedArtworkLightbox>,
    )
    await userEvent.click(screen.getByRole('link'))

    await waitFor(() => expect(fake.options).not.toBeNull())
    expect(slugsOf(fake.options)).toEqual(['river', 'meadow'])
  })

  it('moves to the artwork the visitor left on, keeping the tag filter in the URL', async () => {
    currentSearch = 'tags=landscape'
    render(
      <UrlSyncedArtworkLightbox collection={collection} currentSlug="river">
        <span>picture</span>
      </UrlSyncedArtworkLightbox>,
    )
    await userEvent.click(screen.getByRole('link'))
    await waitFor(() => expect(fake.options).not.toBeNull())

    fake.currIndex = 1
    fake.close()

    expect(push).toHaveBeenCalledWith('/artwork/meadow?tags=landscape')
  })
})
