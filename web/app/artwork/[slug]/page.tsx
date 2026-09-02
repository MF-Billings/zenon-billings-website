import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MediumChip from '@/components/MediumChip'
import SanityImage from '@/components/SanityImage'
import StudioLabel from '@/components/StudioLabel'
import WashBloom from '@/components/WashBloom'
import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'
import { client } from '@/lib/sanity/client'
import { urlFor } from '@/lib/sanity/imageUrl'
import {
  ARTWORK_BY_SLUG_QUERY,
  ARTWORK_SLUGS_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/lib/sanity/queries'
import { buildArtworkJsonLd } from '@/lib/seo/artworkJsonLd'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type ArtworkPageProps = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await client.fetch(ARTWORK_SLUGS_QUERY)
  return slugs.map(({ slug }) => ({ slug: slug! }))
}

export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params
  const artwork = await client.fetch(ARTWORK_BY_SLUG_QUERY, { slug })
  if (!artwork) return {}

  const image = artwork.image ? urlFor(artwork.image).width(1200).url() : undefined

  return {
    title: artwork.title ?? undefined,
    description: artwork.description ?? undefined,
    openGraph: {
      type: 'article',
      title: artwork.title ?? undefined,
      description: artwork.description ?? undefined,
      url: `${siteUrl}/artwork/${artwork.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: artwork.title ?? undefined,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params
  const [artwork, settings] = await Promise.all([
    client.fetch(ARTWORK_BY_SLUG_QUERY, { slug }),
    client.fetch(SITE_SETTINGS_QUERY),
  ])

  if (!artwork) notFound()

  return (
    <article className="artwork-detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildArtworkJsonLd(artwork, settings, siteUrl)),
        }}
      />

      <div className="artwork-detail__plate">
        <WashBloom pigment={pigmentForMedium(artwork.medium)} className="artwork-detail__bloom" />
        {artwork.image && (
          <div className="paper-sheet artwork-detail__mount">
            <SanityImage
              source={artwork.image}
              alt={artwork.altText ?? artwork.title ?? ''}
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              className="artwork-detail__image"
            />
          </div>
        )}
      </div>

      <div className="artwork-detail__placard">
        <h1>{artwork.title}</h1>
        <StudioLabel artwork={artwork} withFieldNames />
        {artwork.description && <p>{artwork.description}</p>}
        <p>
          <MediumChip medium={artwork.medium} />
        </p>
        {artwork.tags && artwork.tags.length > 0 && (
          <p className="artwork-tags">
            {artwork.tags.map((tag) => (
              <mark key={tag._id}>{tag.name}</mark>
            ))}
          </p>
        )}
      </div>
    </article>
  )
}
