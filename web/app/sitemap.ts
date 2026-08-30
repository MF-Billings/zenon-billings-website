import type { MetadataRoute } from 'next'
import { client } from '@/lib/sanity/client'
import { ARTWORK_SLUGS_QUERY } from '@/lib/sanity/queries'

// Required by output: 'export' — without it Next refuses to collect page data for
// this route, since it cannot prove the output is static.
export const dynamic = 'force-static'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await client.fetch(ARTWORK_SLUGS_QUERY)

  const staticPages = [
    { url: siteUrl, priority: 1.0 },
    { url: `${siteUrl}/gallery`, priority: 0.9 },
    { url: `${siteUrl}/about`, priority: 0.6 },
    { url: `${siteUrl}/contact`, priority: 0.6 },
  ]

  const artworkPages = slugs.map(({ slug }) => ({
    url: `${siteUrl}/artwork/${slug}`,
    priority: 0.7,
  }))

  return [...staticPages, ...artworkPages]
}
