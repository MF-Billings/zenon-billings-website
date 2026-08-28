import ArtworkCard from '@/components/ArtworkCard'
import type { Artwork } from '@/lib/sanity/types'

type ArtworkGridProps = {
  artworks: Artwork[]
  emptyMessage?: string
}

export default function ArtworkGrid({
  artworks,
  emptyMessage = 'No artwork to show yet.',
}: ArtworkGridProps) {
  if (artworks.length === 0) return <p>{emptyMessage}</p>

  return (
    <div className="artwork-grid">
      {artworks.map((artwork, index) => (
        <ArtworkCard key={artwork._id} artwork={artwork} priority={index < 3} />
      ))}
    </div>
  )
}
