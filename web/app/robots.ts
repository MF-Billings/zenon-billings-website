import type { MetadataRoute } from 'next'

// Required by output: 'export' — without it Next refuses to collect page data for
// this route, since it cannot prove the output is static.
export const dynamic = 'force-static'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
