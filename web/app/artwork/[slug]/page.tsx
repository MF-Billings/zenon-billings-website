import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import ArtworkLightbox from '@/components/ArtworkLightbox'
import ArtworkNav from '@/components/ArtworkNav'
import ArtworkTags from '@/components/ArtworkTags'
import MediumChip from '@/components/MediumChip'
import SanityImage from '@/components/SanityImage'
import StudioLabel from '@/components/StudioLabel'
import UrlSyncedArtworkLightbox from '@/components/UrlSyncedArtworkLightbox'
import UrlSyncedArtworkNav from '@/components/UrlSyncedArtworkNav'
import WashBloom from '@/components/WashBloom'
import { lightboxSlides } from '@/lib/artwork/lightboxSlides'
import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'
import { resolveDisplayMaxWidth } from '@/lib/artwork/resolveDisplayMaxWidth'
import { client } from '@/lib/sanity/client'
import { urlFor } from '@/lib/sanity/imageUrl'
import {
  ARTWORK_BY_SLUG_QUERY,
  ARTWORK_NAVIGATION_QUERY,
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
  const [artwork, settings, collection] = await Promise.all([
    client.fetch(ARTWORK_BY_SLUG_QUERY, { slug }),
    client.fetch(SITE_SETTINGS_QUERY),
    client.fetch(ARTWORK_NAVIGATION_QUERY),
  ])

  if (!artwork) notFound()

  const picture = artwork.image && (
    <SanityImage
      source={artwork.image}
      alt={artwork.altText ?? artwork.title ?? ''}
      sizes="(max-width: 1024px) 100vw, 60vw"
      priority
      className="artwork-detail__image"
      maxWidth={resolveDisplayMaxWidth(artwork.displayMaxWidth, artwork.imageWidth)}
    />
  )

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
            {/* Reading the URL bails out of prerendering, so the static HTML gets the
                lightbox over the full collection and the tag filter applies after hydration. */}
            <Suspense
              fallback={
                <ArtworkLightbox {...lightboxSlides(collection, slug, [])}>
                  {picture}
                </ArtworkLightbox>
              }
            >
              <UrlSyncedArtworkLightbox collection={collection} currentSlug={slug}>
                {picture}
              </UrlSyncedArtworkLightbox>
            </Suspense>
          </div>
        )}

        {/* Same URL rule as the lightbox: the static HTML walks the full collection. */}
        <Suspense fallback={<ArtworkNav artworks={collection} currentSlug={slug} tagSlugs={[]} />}>
          <UrlSyncedArtworkNav artworks={collection} currentSlug={slug} />
        </Suspense>
      </div>

      <div className="artwork-detail__placard">
        <h1>{artwork.title}</h1>
        <StudioLabel artwork={artwork} withFieldNames />
        {artwork.description && <p>{artwork.description}</p>}

        {artwork.artistNote && (
          <blockquote className="artwork-artist-note">
            <p>{artwork.artistNote}</p>
            <footer>
              <cite>Zenon Billings</cite>
            </footer>
          </blockquote>
        )}

        <p>
          <MediumChip medium={artwork.medium} />
        </p>
        <ArtworkTags tags={artwork.tags} />
      </div>
    </article>
  )
}
