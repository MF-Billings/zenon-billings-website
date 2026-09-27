import { render } from '@testing-library/react'
import BrushstrokeLayer from '@/components/BrushstrokeLayer'

describe('BrushstrokeLayer', () => {
  // The layer is viewport-wide and clips; the column inside it has the page's
  // content-column geometry (Pico's .container) and is what a brushstroke is
  // positioned against, so a brushstroke follows the content on a wide screen
  // instead of the screen's edge.
  it('wraps its children in a content column inside the clipping layer', () => {
    const { container } = render(
      <BrushstrokeLayer>
        <span data-testid="pigment" />
      </BrushstrokeLayer>,
    )
    const layer = container.querySelector('.brushstroke-layer')!
    const column = layer.querySelector(':scope > .brushstroke-layer__column')!
    expect(column).toHaveClass('container')
    expect(column.querySelector('[data-testid="pigment"]')).toBeInTheDocument()
  })

  it('is hidden from assistive technology, being decoration', () => {
    const { container } = render(<BrushstrokeLayer />)
    expect(container.querySelector('.brushstroke-layer')).toHaveAttribute('aria-hidden', 'true')
  })
})
