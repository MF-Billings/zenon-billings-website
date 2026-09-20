import Link from 'next/link'
import SanityImage, { capWidths } from '@/components/SanityImage'
import StudioLabel from '@/components/StudioLabel'
import { artworkPath } from '@/lib/artwork/artworkPath'
import { CARD_ASPECT_RATIO } from '@/lib/artwork/cardAspectRatio'
import { CARD_MAX_WIDTH_REM } from '@/lib/artwork/cardMaxWidth'
import { resolveDisplayMaxWidth } from '@/lib/artwork/resolveDisplayMaxWidth'
import type { Artwork } from '@/lib/sanity/types'

// Roughly 1×, 2× and 3× the widest a card can be (see --card-width-max), so no
// screen density ever fetches more pixels than it can show.
const THUMBNAIL_WIDTHS = [240, 480, 720]

type ArtworkCardProps = {
  artwork: Artwork
  href?: string
  priority?: boolean
}

export default function ArtworkCard({
  artwork,
  href = artworkPath(artwork.slug),
  priority = false,
}: ArtworkCardProps) {
  // A weak scan is capped by the editor in the Studio; the cap applies to the
  // renditions offered, not to the layout, so the card keeps its mat's shape.
  const sourceCap = resolveDisplayMaxWidth(artwork.displayMaxWidth, artwork.imageWidth)
  const widths = sourceCap ? capWidths(THUMBNAIL_WIDTHS, sourceCap) : THUMBNAIL_WIDTHS

  return (
    <article className="artwork-card">
      <Link href={href} className="artwork-card__link">
        <span className="artwork-card__mat">
          {artwork.image && (
            <SanityImage
              source={artwork.image}
              alt={artwork.altText ?? artwork.title ?? ''}
              widths={widths}
              sizes={`${CARD_MAX_WIDTH_REM}rem`}
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
