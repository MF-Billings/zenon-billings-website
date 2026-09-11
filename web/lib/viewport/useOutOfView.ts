import { useEffect, useState, type RefObject } from 'react'

// Reports whether the referenced element has left the viewport. Starts as
// `false` so the server render and the first client paint agree, then follows
// the browser's IntersectionObserver. Where the observer does not exist the
// element is simply treated as always in view.
export function useOutOfView(ref: RefObject<Element | null>): boolean {
  const [outOfView, setOutOfView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(([entry]) => setOutOfView(!entry.isIntersecting))
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref])

  return outOfView
}
