import { render, screen } from '@testing-library/react'
import SanityImage from '@/components/SanityImage'

const source = {
  _type: 'image' as const,
  asset: { _ref: 'image-abc123-1200x900-jpg', _type: 'reference' as const },
}

describe('SanityImage', () => {
  it('renders an image with the supplied alt text', () => {
    render(<SanityImage source={source} alt="A watercolour of a river" />)
    expect(screen.getByRole('img', { name: 'A watercolour of a river' })).toBeInTheDocument()
  })

  it('offers the browser a candidate per requested width', () => {
    render(<SanityImage source={source} alt="Art" widths={[400, 800, 1200]} />)

    const srcSet = screen.getByRole('img').getAttribute('srcset')
    expect(srcSet).toContain('400w')
    expect(srcSet).toContain('800w')
    expect(srcSet).toContain('1200w')
  })

  it('lazy-loads by default so a long gallery does not fetch every image at once', () => {
    render(<SanityImage source={source} alt="Art" />)
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy')
  })

  it('loads eagerly when marked priority, for above-the-fold hero images', () => {
    render(<SanityImage source={source} alt="Art" priority />)
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'eager')
  })

  it('passes the sizes hint through', () => {
    render(<SanityImage source={source} alt="Art" sizes="(max-width: 600px) 100vw, 33vw" />)
    expect(screen.getByRole('img')).toHaveAttribute('sizes', '(max-width: 600px) 100vw, 33vw')
  })

  it('falls back to the largest requested width for src', () => {
    render(<SanityImage source={source} alt="Art" widths={[400, 900]} />)
    expect(screen.getByRole('img').getAttribute('src')).toContain('w=900')
  })
})
