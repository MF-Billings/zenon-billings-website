import Link from 'next/link'
import { findAdjacentArtworks, type NavigableArtwork } from '@/lib/artwork/adjacentArtworks'
import { artworkPath } from '@/lib/artwork/artworkPath'
import { withTagSlugs } from '@/lib/gallery/filterQuery'

export type ArtworkNavProps = {
  artworks: NavigableArtwork[]
  currentSlug: string
  tagSlugs: string[]
}

type Direction = 'previous' | 'next'

type NeighbourLinkProps = {
  artwork: NavigableArtwork
  tagSlugs: string[]
  direction: Direction
}

const LABEL: Record<Direction, string> = { previous: 'Previous artwork', next: 'Next artwork' }

// Same stroke as the back-to-top arrow, turned to point along the collection.
const ARROW_PATH: Record<Direction, string> = {
  previous: 'M20 12H5M11.5 5.5 5 12l6.5 6.5',
  next: 'M4 12h15M12.5 5.5 19 12l-6.5 6.5',
}

function NeighbourLink({ artwork, tagSlugs, direction }: NeighbourLinkProps) {
  return (
    <Link
      role="button"
      className={`artwork-nav__button artwork-nav__button--${direction}`}
      href={withTagSlugs(artworkPath(artwork.slug), tagSlugs)}
      aria-label={`${LABEL[direction]}: ${artwork.title}`}
    >
      <svg className="artwork-nav__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d={ARROW_PATH[direction]}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  )
}

export default function ArtworkNav({ artworks, currentSlug, tagSlugs }: ArtworkNavProps) {
  const { previous, next } = findAdjacentArtworks(artworks, currentSlug, tagSlugs)

  if (!previous && !next) return null

  return (
    <nav className="artwork-nav" aria-label="Browse artwork">
      {previous && <NeighbourLink artwork={previous} tagSlugs={tagSlugs} direction="previous" />}
      {next && <NeighbourLink artwork={next} tagSlugs={tagSlugs} direction="next" />}
    </nav>
  )
}
