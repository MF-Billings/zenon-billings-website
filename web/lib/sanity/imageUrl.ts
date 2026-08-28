import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { dataset, projectId } from './client'

const builder = createImageUrlBuilder({ projectId, dataset })

export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto('format').fit('max')
}

export function buildSrcSet(source: SanityImageSource, widths: number[]): string {
  return widths.map((width) => `${urlFor(source).width(width).url()} ${width}w`).join(', ')
}
