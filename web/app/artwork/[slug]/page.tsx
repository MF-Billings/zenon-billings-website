import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SanityImage from '@/components/SanityImage'
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
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildArtworkJsonLd(artwork, settings, siteUrl)),
        }}
      />

      {artwork.image && (
        <SanityImage
          source={artwork.image}
          alt={artwork.altText ?? artwork.title ?? ''}
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />
      )}

      <h1>{artwork.title}</h1>

      <dl>
        {artwork.medium && (
          <>
            <dt>Medium</dt>
            <dd>{artwork.medium}</dd>
          </>
        )}
        {artwork.dimensions && (
          <>
            <dt>Dimensions</dt>
            <dd>{artwork.dimensions}</dd>
          </>
        )}
        {artwork.yearCreated && (
          <>
            <dt>Year</dt>
            <dd>{artwork.yearCreated}</dd>
          </>
        )}
      </dl>

      {artwork.description && <p>{artwork.description}</p>}

      {artwork.tags && artwork.tags.length > 0 && (
        <p className="artwork-tags">
          {artwork.tags.map((tag) => (
            <mark key={tag._id}>{tag.name}</mark>
          ))}
        </p>
      )}
    </article>
  )
}
