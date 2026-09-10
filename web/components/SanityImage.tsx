import type { SanityImageSource } from '@sanity/image-url'
import { buildSrcSet, urlFor } from '@/lib/sanity/imageUrl'

const DEFAULT_WIDTHS = [400, 800, 1200, 1600]

type SanityImageProps = {
  source: SanityImageSource
  alt: string
  widths?: number[]
  sizes?: string
  priority?: boolean
  className?: string
  /** Widest the image may render, in CSS pixels. Also caps the srcset so nothing wider is fetched. */
  maxWidth?: number | null
}

// Candidates wider than the cap would never be displayed at that size, so they
// are dropped; a candidate at the cap itself makes sure the sharpest useful
// rendition is still offered.
export function capWidths(widths: number[], maxWidth: number): number[] {
  const kept = widths.filter((width) => width < maxWidth)
  return [...kept, maxWidth]
}

export default function SanityImage({
  source,
  alt,
  widths = DEFAULT_WIDTHS,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  className,
  maxWidth = null,
}: SanityImageProps) {
  const candidateWidths = maxWidth ? capWidths(widths, maxWidth) : widths
  const fallbackWidth = candidateWidths[candidateWidths.length - 1]

  return (
    // next/image needs a server to optimize; this site is a static export and
    // Sanity's CDN does the resizing via the srcset above.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={urlFor(source).width(fallbackWidth).url()}
      srcSet={buildSrcSet(source, candidateWidths)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      // min() keeps the cap from overflowing a viewport narrower than the cap itself.
      style={maxWidth ? { maxWidth: `min(${maxWidth}px, 100%)` } : undefined}
    />
  )
}
