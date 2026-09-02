import { render } from '@testing-library/react'
import InkRule from '@/components/InkRule'

describe('InkRule', () => {
  it('draws a rule', () => {
    const { container } = render(<InkRule />)
    expect(container.querySelector('path')).toBeInTheDocument()
  })

  it('is hidden from assistive technology, being decorative rather than a separator', () => {
    const { container } = render(<InkRule />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('accepts a placement class from its caller', () => {
    const { container } = render(<InkRule className="site-header__rule" />)
    expect(container.querySelector('svg')).toHaveClass('ink-rule', 'site-header__rule')
  })
})
