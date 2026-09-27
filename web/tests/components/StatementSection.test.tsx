import { render, screen } from '@testing-library/react'
import StatementSection from '@/components/StatementSection'
import type { SiteSettings } from '@/lib/sanity/types'

const paragraphs = (...texts: string[]): SiteSettings['statement'] =>
  texts.map((text, index) => ({
    _type: 'block',
    _key: `b${index}`,
    style: 'normal',
    markDefs: null,
    children: [{ _type: 'span', _key: `s${index}`, text, marks: [] }],
  }))

const image = {
  _type: 'image' as const,
  asset: { _ref: 'image-abc-1200x1500-jpg', _type: 'reference' as const },
}

describe('StatementSection', () => {
  it('renders nothing until a statement has been written', () => {
    const { container } = render(<StatementSection artistName="Zenon Billings" statement={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('sets the statement paragraphs as the section body', () => {
    render(
      <StatementSection
        artistName="Zenon Billings"
        statement={paragraphs('I paint slowly.', 'This is where the sheets go.')}
      />,
    )
    expect(screen.getByText('I paint slowly.')).toBeInTheDocument()
    expect(screen.getByText('This is where the sheets go.')).toBeInTheDocument()
  })

  it('carries a lowercase chrome heading and an ink rule only when a heading is set', () => {
    const { container, rerender } = render(
      <StatementSection artistName="Z" statement={paragraphs('Text.')} heading="Why paint" />,
    )
    const heading = screen.getByRole('heading', { level: 2, name: 'Why paint' })
    expect(heading).toHaveClass('lowercase-chrome')
    expect(container.querySelector('.ink-rule')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Why paint' })).toBeInTheDocument()

    rerender(<StatementSection artistName="Z" statement={paragraphs('Text.')} />)
    expect(screen.queryByRole('heading')).toBeNull()
    expect(container.querySelector('.ink-rule')).toBeNull()
  })

  it('still names the region for assistive technology when there is no visible heading', () => {
    render(<StatementSection artistName="Z" statement={paragraphs('Text.')} />)
    expect(screen.getByRole('region', { name: /statement/i })).toBeInTheDocument()
  })

  it('shows the portrait on a paper sheet when an image is set', () => {
    render(
      <StatementSection
        artistName="Zenon Billings"
        statement={paragraphs('Text.')}
        image={image}
      />,
    )
    const portrait = screen.getByRole('img', { name: 'Portrait of Zenon Billings' })
    expect(portrait.closest('figure')).toHaveClass('paper-sheet')
  })

  it('omits the portrait entirely when no image is set', () => {
    render(<StatementSection artistName="Z" statement={paragraphs('Text.')} />)
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('signs the statement only when an attribution is set', () => {
    const { container, rerender } = render(
      <StatementSection
        artistName="Z"
        statement={paragraphs('Text.')}
        attribution="Zenon Billings"
      />,
    )
    expect(screen.getByText('Zenon Billings')).toHaveClass('statement__signature')

    rerender(<StatementSection artistName="Z" statement={paragraphs('Text.')} />)
    expect(container.querySelector('.statement__signature')).toBeNull()
  })
})
