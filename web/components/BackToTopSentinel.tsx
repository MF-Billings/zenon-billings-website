'use client'

import { useRef } from 'react'
import BackToTopButton from '@/components/BackToTopButton'
import { useOutOfView } from '@/lib/viewport/useOutOfView'

// For pages with no natural anchor control of their own (the gallery watches
// its search input): drops an empty marker where it is rendered and shows the
// back-to-top button once that marker has scrolled out of view.
export default function BackToTopSentinel() {
  const marker = useRef<HTMLSpanElement>(null)
  const markerOutOfView = useOutOfView(marker)

  return (
    <>
      <span ref={marker} aria-hidden="true" />
      <BackToTopButton visible={markerOutOfView} />
    </>
  )
}
