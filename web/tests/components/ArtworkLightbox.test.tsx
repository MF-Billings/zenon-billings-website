import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ArtworkLightbox from '@/components/ArtworkLightbox'
import type { LightboxSlide } from '@/lib/artwork/lightboxSlides'

type Handler = () => void

// A stand-in for PhotoSwipe's lightbox: records what it was built with and what
// was opened, and lets the test fire "close" at a chosen slide.
const fake = {
  options: null as Record<string, unknown> | null,
  opened: [] as number[],
  handlers: {} as Record<string, Handler>,
  currIndex: 0,
  destroyed: 0,
}

vi.mock('photoswipe/lightbox', () => ({
  default: class {
    pswp: { currIndex: number }
    constructor(options: Record<string, unknown>) {
      fake.options = options
      this.pswp = fake
    }
    init() {}
    on(name: string, handler: Handler) {
      fake.handlers[name] = handler
    }
    loadAndOpen(index: number) {
      fake.opened.push(index)
      fake.currIndex = index
      return true
    }
    destroy() {
      fake.destroyed += 1
    }
  },
}))

const slide = (slug: string): LightboxSlide => ({
  slug,
  src: `https://cdn.example/${slug}.jpg`,
  width: 4000,
  height: 3000,
  alt: `${slug} alt`,
})
const slides = [slide('river'), slide('portrait'), slide('meadow')]

const trigger = () => screen.getByRole('link', { name: /view .* full size/i })

describe('ArtworkLightbox', () => {
  beforeEach(() => {
    fake.options = null
    fake.opened = []
    fake.handlers = {}
    fake.destroyed = 0
  })

  it('wraps the picture in a link to its full-size image, so no-JS still gets the image', () => {
    render(
      <ArtworkLightbox slides={slides} startIndex={1}>
        <span>portrait alt</span>
      </ArtworkLightbox>,
    )
    expect(trigger()).toHaveAttribute('href', 'https://cdn.example/portrait.jpg')
    expect(screen.getByText('portrait alt')).toBeInTheDocument()
  })

  it('opens PhotoSwipe at the current slide over the whole slide set', async () => {
    render(
      <ArtworkLightbox slides={slides} startIndex={1}>
        <span>picture</span>
      </ArtworkLightbox>,
    )

    await userEvent.click(trigger())

    await waitFor(() => expect(fake.opened).toEqual([1]))
    expect(fake.options?.dataSource).toEqual(slides)
  })

  it('reports the slide the visitor left on when it differs from the one they opened', async () => {
    const onLeaveAt = vi.fn()
    render(
      <ArtworkLightbox slides={slides} startIndex={1} onLeaveAt={onLeaveAt}>
        <span>picture</span>
      </ArtworkLightbox>,
    )

    await userEvent.click(trigger())
    await waitFor(() => expect(fake.handlers.close).toBeDefined())

    fake.currIndex = 2
    fake.handlers.close()

    expect(onLeaveAt).toHaveBeenCalledWith(slides[2])
  })

  it('stays quiet when the visitor closes on the slide they opened', async () => {
    const onLeaveAt = vi.fn()
    render(
      <ArtworkLightbox slides={slides} startIndex={1} onLeaveAt={onLeaveAt}>
        <span>picture</span>
      </ArtworkLightbox>,
    )

    await userEvent.click(trigger())
    await waitFor(() => expect(fake.handlers.close).toBeDefined())

    fake.handlers.close()

    expect(onLeaveAt).not.toHaveBeenCalled()
  })

  it('renders the picture plainly when there is nothing to show in a lightbox', () => {
    render(
      <ArtworkLightbox slides={[]} startIndex={0}>
        <span>lonely</span>
      </ArtworkLightbox>,
    )
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('lonely')).toBeInTheDocument()
  })

  it('tears PhotoSwipe down when it unmounts', async () => {
    const { unmount } = render(
      <ArtworkLightbox slides={slides} startIndex={0}>
        <span>picture</span>
      </ArtworkLightbox>,
    )
    await userEvent.click(trigger())
    await waitFor(() => expect(fake.opened).toHaveLength(1))

    unmount()

    expect(fake.destroyed).toBe(1)
  })
})
