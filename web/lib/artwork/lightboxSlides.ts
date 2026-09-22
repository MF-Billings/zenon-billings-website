import type { SanityImageSource } from '@sanity/image-url'
import { resolveDisplayMaxWidth } from '@/lib/artwork/resolveDisplayMaxWidth'
import { EMPTY_FILTER, filterArtworks, type FilterableArtwork } from '@/lib/gallery/filterArtworks'
import { urlFor } from '@/lib/sanity/imageUrl'

export type LightboxArtwork = FilterableArtwork & {
  slug: string | null
  image: SanityImageSource | null
  imageWidth: number | null
  imageHeight: number | null
  altText: string | null
  displayMaxWidth: number | null
}

export type LightboxSlide = {
  slug: string
  src: string
  width: number
  height: number
  alt: string
}

export type LightboxSlideSet = { slides: LightboxSlide[]; startIndex: number }

function toSlide(artwork: LightboxArtwork): LightboxSlide | null {
  const { slug, image, imageWidth, imageHeight } = artwork
  if (!slug || !image || !imageWidth || !imageHeight) return null

  // The same cap the page applies: a weak scan is never offered wider than the
  // editor allowed, and the CDN never upscales past the native pixels anyway.
  const width = resolveDisplayMaxWidth(artwork.displayMaxWidth, imageWidth) ?? imageWidth
  const height = Math.round((imageHeight * width) / imageWidth)

  return {
    slug,
    src: urlFor(image).width(width).url(),
    width,
    height,
    alt: artwork.altText ?? artwork.title ?? '',
  }
}

function slideSetWithin(
  collection: LightboxArtwork[],
  currentSlug: string,
): LightboxSlideSet | null {
  const slides = collection.map(toSlide).filter((slide): slide is LightboxSlide => slide !== null)
  const startIndex = slides.findIndex((slide) => slide.slug === currentSlug)
  return startIndex === -1 ? null : { slides, startIndex }
}

export function lightboxSlides(
  collection: LightboxArtwork[],
  currentSlug: string,
  tagSlugs: string[],
): LightboxSlideSet {
  const tagged = filterArtworks(collection, { ...EMPTY_FILTER, tagSlugs })

  return (
    slideSetWithin(tagged, currentSlug) ??
    slideSetWithin(collection, currentSlug) ?? { slides: [], startIndex: 0 }
  )
}
