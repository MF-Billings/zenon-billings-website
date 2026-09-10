import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { dataset, projectId } from './client'

const builder = createImageUrlBuilder({ projectId, dataset })

export type ImageSizeOptions = {
  /**
   * Width divided by height. When set, the CDN crops to this shape around the
   * editor's hotspot instead of preserving the source proportions.
   */
  aspectRatio?: number
}

export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto('format').fit('max')
}

export function heightFor(width: number, aspectRatio: number): number {
  return Math.round(width / aspectRatio)
}

export function imageUrl(
  source: SanityImageSource,
  width: number,
  { aspectRatio }: ImageSizeOptions = {},
): string {
  const image = urlFor(source).width(width)
  if (aspectRatio === undefined) return image.url()
  return image.height(heightFor(width, aspectRatio)).fit('crop').url()
}

export function buildSrcSet(
  source: SanityImageSource,
  widths: number[],
  options: ImageSizeOptions = {},
): string {
  return widths.map((width) => `${imageUrl(source, width, options)} ${width}w`).join(', ')
}
