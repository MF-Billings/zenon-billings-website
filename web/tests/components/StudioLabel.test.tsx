import { render, screen } from '@testing-library/react'
import StudioLabel from '@/components/StudioLabel'
import type { Artwork } from '@/lib/sanity/types'

const artwork = {
  yearCreated: 2024,
  medium: 'watercolour',
  dimensions: { width: 30, height: 40, unit: 'cm' },
} as unknown as Artwork

describe('StudioLabel', () => {
  it('reads as a single studio label when every field is present', () => {
    const { container } = render(<StudioLabel artwork={artwork} />)
    expect(container.textContent).toBe('2024 · watercolour · 30 × 40 cm')
  })

  it('drops the year without leaving a stray separator', () => {
    const { container } = render(
      <StudioLabel artwork={{ ...artwork, yearCreated: null } as unknown as Artwork} />,
    )
    expect(container.textContent).toBe('watercolour · 30 × 40 cm')
  })

  it('drops the dimensions without leaving a stray separator', () => {
    const { container } = render(
      <StudioLabel artwork={{ ...artwork, dimensions: null } as unknown as Artwork} />,
    )
    expect(container.textContent).toBe('2024 · watercolour')
  })

  it('shows a lone year on its own', () => {
    const { container } = render(
      <StudioLabel
        artwork={{ yearCreated: 2024, medium: null, dimensions: null } as unknown as Artwork}
      />,
    )
    expect(container.textContent).toBe('2024')
  })

  it('renders nothing at all when there is no metadata to show', () => {
    const { container } = render(
      <StudioLabel
        artwork={{ yearCreated: null, medium: null, dimensions: null } as unknown as Artwork}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('tags the medium with its pigment so it can be coloured', () => {
    render(<StudioLabel artwork={artwork} />)
    expect(screen.getByText('watercolour')).toHaveAttribute('data-pigment', 'watercolour')
  })

  it('tags an unrecognised medium with the fallback pigment', () => {
    render(<StudioLabel artwork={{ ...artwork, medium: 'oil' } as unknown as Artwork} />)
    expect(screen.getByText('oil')).toHaveAttribute('data-pigment', 'other')
  })
})
