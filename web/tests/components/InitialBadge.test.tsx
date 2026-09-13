import { render, screen } from '@testing-library/react'
import InitialBadge from '@/components/InitialBadge'

describe('InitialBadge', () => {
  it('wraps only the first letter in the badge', () => {
    const { container } = render(<InitialBadge text="Zenon Billings" />)
    const badge = container.querySelector('.initial-badge')
    expect(badge).toHaveTextContent(/^Z$/)
  })

  it('keeps the rest of the text outside the badge, unbroken', () => {
    const { container } = render(<InitialBadge text="Zenon Billings" />)
    // No whitespace between the badge and the rest, so the accessible name stays whole.
    expect(container).toHaveTextContent(/^Zenon Billings$/)
    expect(container.querySelector('.initial-badge')?.nextSibling).toHaveProperty(
      'textContent',
      'enon Billings',
    )
  })

  it('reads as one unbroken name to assistive technology', () => {
    render(
      <h1>
        <InitialBadge text="Zenon Billings" />
      </h1>,
    )
    expect(screen.getByRole('heading', { name: 'Zenon Billings' })).toBeInTheDocument()
  })

  it('renders nothing for empty text', () => {
    const { container } = render(<InitialBadge text="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('handles a single-character name without a trailing fragment', () => {
    const { container } = render(<InitialBadge text="Z" />)
    expect(container).toHaveTextContent(/^Z$/)
    expect(container.querySelector('.initial-badge')).toHaveTextContent(/^Z$/)
  })

  it('treats a multi-code-unit first character as one letter', () => {
    // U+1D505 MATHEMATICAL FRAKTUR CAPITAL B is two UTF-16 code units.
    const { container } = render(<InitialBadge text="𝔅illings" />)
    expect(container.querySelector('.initial-badge')).toHaveTextContent(/^𝔅$/)
    expect(container).toHaveTextContent(/^𝔅illings$/)
  })
})
