'use client'

import 'photoswipe/style.css'
import type PhotoSwipeLightbox from 'photoswipe/lightbox'
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'
import type { LightboxSlide } from '@/lib/artwork/lightboxSlides'

type ArtworkLightboxProps = {
  slides: LightboxSlide[]
  startIndex: number
  /** Called on close when the visitor ended on a different slide than they opened. */
  onLeaveAt?: (slide: LightboxSlide) => void
  children: ReactNode
}

export default function ArtworkLightbox({
  slides,
  startIndex,
  onLeaveAt,
  children,
}: ArtworkLightboxProps) {
  const lightbox = useRef<PhotoSwipeLightbox | null>(null)

  useEffect(() => () => lightbox.current?.destroy(), [])

  const current = slides[startIndex]
  if (!current) return <>{children}</>

  // PhotoSwipe is only fetched on the first click, so a visitor who never opens
  // the lightbox never downloads it.
  const open = async (event: MouseEvent) => {
    event.preventDefault()

    if (!lightbox.current) {
      const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox')
      const instance = new PhotoSwipeLightbox({
        dataSource: slides,
        pswpModule: () => import('photoswipe'),
      })
      instance.on('close', () => {
        const index = instance.pswp?.currIndex
        if (index !== undefined && index !== startIndex) onLeaveAt?.(slides[index])
      })
      instance.init()
      lightbox.current = instance
    }

    lightbox.current.loadAndOpen(startIndex)
  }

  return (
    <a
      className="artwork-lightbox__trigger"
      href={current.src}
      aria-label={`View ${current.alt} full size`}
      onClick={open}
    >
      {children}
    </a>
  )
}
