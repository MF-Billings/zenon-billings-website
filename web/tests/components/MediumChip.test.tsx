import { render, screen } from '@testing-library/react'
import MediumChip from '@/components/MediumChip'

describe('MediumChip', () => {
  it('names the medium', () => {
    render(<MediumChip medium="watercolour" />)
    expect(screen.getByText('watercolour')).toBeInTheDocument()
  })

  it('carries the pigment for the medium', () => {
    render(<MediumChip medium="photography" />)
    expect(screen.getByText('photography')).toHaveAttribute('data-pigment', 'photography')
  })

  it('falls back to a defined pigment for an unrecognised medium', () => {
    render(<MediumChip medium="oil" />)
    expect(screen.getByText('oil')).toHaveAttribute('data-pigment', 'other')
  })

  it('renders nothing when there is no medium', () => {
    const { container } = render(<MediumChip medium={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
