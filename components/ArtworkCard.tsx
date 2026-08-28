import Link from 'next/link'
import SanityImage from '@/components/SanityImage'
import type { Artwork } from '@/lib/sanity/types'

type ArtworkCardProps = {
  artwork: Artwork
  priority?: boolean
}

export default function ArtworkCard({ artwork, priority = false }: ArtworkCardProps) {
  return (
    <article className="artwork-card">
      <Link href={`/artwork/${artwork.slug}`}>
        {artwork.image && (
          <SanityImage
            source={artwork.image}
            alt={artwork.altText ?? artwork.title ?? ''}
            widths={[300, 600, 900]}
            sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        )}
        <h3>{artwork.title}</h3>
        {artwork.yearCreated && <small>{artwork.yearCreated}</small>}
      </Link>
    </article>
  )
}
