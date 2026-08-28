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
}

export default function SanityImage({
  source,
  alt,
  widths = DEFAULT_WIDTHS,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  className,
}: SanityImageProps) {
  const fallbackWidth = widths[widths.length - 1]

  return (
    <img
      src={urlFor(source).width(fallbackWidth).url()}
      srcSet={buildSrcSet(source, widths)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  )
}
