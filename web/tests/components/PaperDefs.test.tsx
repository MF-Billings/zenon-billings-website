import { render } from '@testing-library/react'
import PaperDefs from '@/components/PaperDefs'

describe('PaperDefs', () => {
  it('defines the bloom filter under the id everything else references', () => {
    const { container } = render(<PaperDefs />)
    expect(container.querySelector('filter#bloom-edge')).toBeInTheDocument()
  })

  it('is hidden from assistive technology, being purely decorative', () => {
    const { container } = render(<PaperDefs />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
