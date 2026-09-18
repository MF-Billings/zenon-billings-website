import { act, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import BackToTopSentinel from '@/components/BackToTopSentinel'

type Callback = (entries: Pick<IntersectionObserverEntry, 'isIntersecting'>[]) => void

// jsdom has no layout, so the observer is driven by hand, as in the hook's own tests.
const installObserver = () => {
  const state = { callback: null as Callback | null, observed: [] as Element[] }
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: Callback) {
        state.callback = callback
      }
      observe(element: Element) {
        state.observed.push(element)
      }
      disconnect() {}
    },
  )
  return state
}

describe('BackToTopSentinel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('renders a back-to-top button that starts hidden', () => {
    installObserver()
    render(<BackToTopSentinel />)
    expect(screen.getByLabelText(/back to top/i)).not.toBeVisible()
  })

  it('watches its own marker, an element with no content of its own', () => {
    const observer = installObserver()
    const { container } = render(<BackToTopSentinel />)

    expect(observer.observed).toHaveLength(1)
    const marker = observer.observed[0]
    expect(container.contains(marker)).toBe(true)
    expect(marker).toHaveAttribute('aria-hidden', 'true')
    expect(marker).toBeEmptyDOMElement()
  })

  it('shows the button once the marker has scrolled out of view, and hides it again after', () => {
    const observer = installObserver()
    render(<BackToTopSentinel />)

    act(() => observer.callback?.([{ isIntersecting: false }]))
    expect(screen.getByRole('button', { name: /back to top/i })).toBeVisible()

    act(() => observer.callback?.([{ isIntersecting: true }]))
    expect(screen.getByLabelText(/back to top/i)).not.toBeVisible()
  })
})
