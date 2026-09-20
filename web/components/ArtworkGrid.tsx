import ArtworkCard from '@/components/ArtworkCard'
import type { Artwork } from '@/lib/sanity/types'

type ArtworkGridProps = {
  artworks: Artwork[]
  emptyMessage?: string
  hrefFor?: (artwork: Artwork) => string
}

export default function ArtworkGrid({
  artworks,
  emptyMessage = 'No artwork to show yet.',
  hrefFor,
}: ArtworkGridProps) {
  if (artworks.length === 0) return <p>{emptyMessage}</p>

  return (
    <div className="artwork-grid">
      {artworks.map((artwork, index) => (
        <ArtworkCard
          key={artwork._id}
          artwork={artwork}
          href={hrefFor?.(artwork)}
          priority={index < 3}
        />
      ))}
    </div>
  )
}
