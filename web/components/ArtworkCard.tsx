import Link from 'next/link'
import SanityImage from '@/components/SanityImage'
import StudioLabel from '@/components/StudioLabel'
import { CARD_ASPECT_RATIO } from '@/lib/artwork/cardAspectRatio'
import type { Artwork } from '@/lib/sanity/types'

type ArtworkCardProps = {
  artwork: Artwork
  priority?: boolean
}

export default function ArtworkCard({ artwork, priority = false }: ArtworkCardProps) {
  return (
    <article className="artwork-card">
      <Link href={`/artwork/${artwork.slug}`} className="artwork-card__link">
        <span className="artwork-card__mat">
          {artwork.image && (
            <SanityImage
              source={artwork.image}
              alt={artwork.altText ?? artwork.title ?? ''}
              widths={[300, 600, 900]}
              sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
              // Cropped by the CDN to the mat's own ratio, so every thumbnail
              // fills its mat edge to edge whatever shape the source is.
              aspectRatio={CARD_ASPECT_RATIO}
              priority={priority}
              className="artwork-card__image"
            />
          )}
        </span>
        <h3 className="artwork-card__title">{artwork.title}</h3>
        <StudioLabel artwork={artwork} />
      </Link>
    </article>
  )
}
