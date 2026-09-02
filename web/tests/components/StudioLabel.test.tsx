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

  describe('withFieldNames', () => {
    it('omits field names by default', () => {
      const { container } = render(<StudioLabel artwork={artwork} />)
      expect(container.textContent).not.toContain('Year:')
      expect(container.textContent).not.toContain('Medium:')
      expect(container.textContent).not.toContain('Dimensions:')
    })

    it('prefixes each present field with its visually-hidden name when opted in', () => {
      render(<StudioLabel artwork={artwork} withFieldNames />)
      expect(screen.getByText('Year:')).toBeInTheDocument()
      expect(screen.getByText('Medium:')).toBeInTheDocument()
      expect(screen.getByText('Dimensions:')).toBeInTheDocument()
    })

    it('gives field names the visually-hidden class rather than new CSS', () => {
      render(<StudioLabel artwork={artwork} withFieldNames />)
      expect(screen.getByText('Year:')).toHaveClass('visually-hidden')
      expect(screen.getByText('Medium:')).toHaveClass('visually-hidden')
      expect(screen.getByText('Dimensions:')).toHaveClass('visually-hidden')
    })

    it('keeps the medium span containing only the medium text, tagged with data-pigment', () => {
      render(<StudioLabel artwork={artwork} withFieldNames />)
      const medium = screen.getByText('watercolour')
      expect(medium).toHaveAttribute('data-pigment', 'watercolour')
      expect(medium.textContent).toBe('watercolour')
    })

    it('still tags an unrecognised medium with the fallback pigment when labelled', () => {
      render(
        <StudioLabel
          artwork={{ ...artwork, medium: 'oil' } as unknown as Artwork}
          withFieldNames
        />,
      )
      const medium = screen.getByText('oil')
      expect(medium).toHaveAttribute('data-pigment', 'other')
      expect(medium.textContent).toBe('oil')
    })

    it('does not render a field name for a part that is absent', () => {
      const { container } = render(
        <StudioLabel
          artwork={{ ...artwork, yearCreated: null } as unknown as Artwork}
          withFieldNames
        />,
      )
      expect(container.textContent).not.toContain('Year:')
      expect(screen.getByText('Medium:')).toBeInTheDocument()
      expect(screen.getByText('Dimensions:')).toBeInTheDocument()
    })

    it('renders the same visible text as the unlabelled default', () => {
      const unlabelled = render(<StudioLabel artwork={artwork} />)
      const labelledText = render(<StudioLabel artwork={artwork} withFieldNames />).container
        .textContent
      // the field names are visually-hidden, not display:none, so they still
      // appear in textContent — strip them to compare what a sighted user sees
      const visibleOnly = labelledText
        ?.replace('Year:', '')
        .replace('Medium:', '')
        .replace('Dimensions:', '')
      expect(visibleOnly).toBe(unlabelled.container.textContent)
    })
  })
})
