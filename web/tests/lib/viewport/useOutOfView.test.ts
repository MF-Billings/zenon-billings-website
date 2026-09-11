import { act, renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useOutOfView } from '@/lib/viewport/useOutOfView'

type Callback = (entries: Pick<IntersectionObserverEntry, 'isIntersecting'>[]) => void

// A hand-rolled observer stand-in: jsdom has no layout, so IntersectionObserver
// never exists there and the only way to test the hook is to drive it by hand.
const installObserver = () => {
  const state = { callback: null as Callback | null, observed: [] as Element[], disconnected: 0 }
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: Callback) {
        state.callback = callback
      }
      observe(element: Element) {
        state.observed.push(element)
      }
      disconnect() {
        state.disconnected += 1
      }
    },
  )
  return state
}

describe('useOutOfView', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports the element as in view until told otherwise', () => {
    installObserver()
    const ref = { current: document.createElement('div') }

    const { result } = renderHook(() => useOutOfView(ref))

    expect(result.current).toBe(false)
  })

  it('observes the referenced element', () => {
    const observer = installObserver()
    const ref = { current: document.createElement('div') }

    renderHook(() => useOutOfView(ref))

    expect(observer.observed).toEqual([ref.current])
  })

  it('flips to out of view when the element leaves the viewport and back again', () => {
    const observer = installObserver()
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useOutOfView(ref))

    act(() => observer.callback!([{ isIntersecting: false }]))
    expect(result.current).toBe(true)

    act(() => observer.callback!([{ isIntersecting: true }]))
    expect(result.current).toBe(false)
  })

  it('treats the element as in view where IntersectionObserver does not exist', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const ref = { current: document.createElement('div') }

    const { result } = renderHook(() => useOutOfView(ref))

    expect(result.current).toBe(false)
  })

  it('stops observing on unmount', () => {
    const observer = installObserver()
    const ref = { current: document.createElement('div') }
    const { unmount } = renderHook(() => useOutOfView(ref))

    unmount()

    expect(observer.disconnected).toBe(1)
  })
})
