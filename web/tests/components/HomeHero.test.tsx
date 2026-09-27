import { render, screen } from '@testing-library/react'
import HomeHero from '@/components/HomeHero'
import { brushstrokeWideMediaQuery } from '@/lib/brushstroke/brushstrokeWideBreakpoint'

describe('HomeHero', () => {
  it('sets the artist name as the page heading, badged initial and all', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Zenon Billings' })).toBeInTheDocument()
    expect(container.querySelector('h1 .initial-badge')).toHaveTextContent(/^Z$/)
  })

  it('declares the heading as the page-level wordmark, so the header can stand down', () => {
    render(<HomeHero artistName="Zenon Billings" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('data-site-wordmark')
  })

  it('shows the tagline beneath the name when there is one', () => {
    render(
      <HomeHero artistName="Zenon Billings" tagline="Watercolour, drawing, and photography." />,
    )
    expect(screen.getByText('Watercolour, drawing, and photography.')).toHaveClass('hero__tagline')
  })

  it('omits the tagline element entirely when there is none', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    expect(container.querySelector('.hero__tagline')).toBeNull()
  })

  // The two brushstroke layers hang from their static positions: the first from
  // the hero's top (the header rule), the second from the bottom of the heading
  // group (the tagline). That only holds while they sit exactly here in the DOM.
  it('hangs a brushstroke layer before the heading group and one after it', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    const hero = container.querySelector('.hero')!
    expect(Array.from(hero.children).map((child) => child.className)).toEqual([
      'brushstroke-layer',
      '',
      'brushstroke-layer',
    ])
    expect(hero.children[1].tagName).toBe('HGROUP')
  })

  it('art-directs the tree: one pine on a phone, two pines from the wide breakpoint', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    const picture = container.querySelector(
      '.hero > .brushstroke-layer:first-child > .brushstroke-layer__column > picture',
    )!
    const source = picture.querySelector('source')!
    const tree = picture.querySelector('img')!

    expect(source).toHaveAttribute('media', brushstrokeWideMediaQuery())
    expect(source).toHaveAttribute('srcset', '/brushstrokes/trees.webp')
    // The wide file has its own aspect ratio; without these the box keeps the
    // phone file's ratio until the bytes arrive.
    expect(source).toHaveAttribute('width')
    expect(source).toHaveAttribute('height')

    expect(tree).toHaveClass('brushstroke', 'hero__tree')
    expect(tree).toHaveAttribute('src', '/brushstrokes/tree.webp')
    expect(tree).toHaveAttribute('alt', '')
    expect(tree).toHaveAttribute('decoding', 'async')
    expect(tree).toHaveAttribute('width')
    expect(tree).toHaveAttribute('height')
  })

  it('hangs the water below the heading group, lazily so a phone never fetches it', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    const water = container.querySelector(
      '.hero > .brushstroke-layer:last-child > .brushstroke-layer__column > img',
    )!

    expect(water).toHaveClass('brushstroke', 'hero__water')
    expect(water).toHaveAttribute('src', '/brushstrokes/water.webp')
    expect(water).toHaveAttribute('alt', '')
    expect(water).toHaveAttribute('decoding', 'async')
    // React 19 would otherwise preload a plain <img> on every device, and a
    // lazy image with no box (display: none below the breakpoint) is never fetched.
    expect(water).toHaveAttribute('loading', 'lazy')
    expect(water).toHaveAttribute('width')
    expect(water).toHaveAttribute('height')
  })
})
