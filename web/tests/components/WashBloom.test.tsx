import { render } from '@testing-library/react'
import WashBloom from '@/components/WashBloom'

describe('WashBloom', () => {
  it('carries the pigment it was given, so the CSS can colour it', () => {
    const { container } = render(<WashBloom pigment="photography" />)
    expect(container.querySelector('svg')).toHaveAttribute('data-pigment', 'photography')
  })

  it('references the shared bloom filter rather than defining its own', () => {
    const { container } = render(<WashBloom pigment="watercolour" />)
    expect(container.querySelector('[filter="url(#bloom-edge)"]')).toBeInTheDocument()
    expect(container.querySelector('filter')).toBeNull()
  })

  it('is hidden from assistive technology, being purely decorative', () => {
    const { container } = render(<WashBloom pigment="watercolour" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('accepts a placement class from its caller', () => {
    const { container } = render(<WashBloom pigment="drawing" className="hero__bloom" />)
    expect(container.querySelector('svg')).toHaveClass('wash-bloom', 'hero__bloom')
  })
})
