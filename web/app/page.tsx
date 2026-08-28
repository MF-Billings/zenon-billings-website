import Link from 'next/link'
import ArtworkGrid from '@/components/ArtworkGrid'
import { client } from '@/lib/sanity/client'
import { FEATURED_ARTWORKS_QUERY, SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'

export default async function HomePage() {
  const [featured, settings] = await Promise.all([
    client.fetch(FEATURED_ARTWORKS_QUERY),
    client.fetch(SITE_SETTINGS_QUERY),
  ])

  return (
    <>
      <hgroup>
        <h1>{settings?.artistName ?? 'Zenon Billings'}</h1>
        {settings?.tagline && <p>{settings.tagline}</p>}
      </hgroup>

      <h2>Featured work</h2>
      <ArtworkGrid
        artworks={featured}
        emptyMessage="No featured artwork yet — browse the full gallery below."
      />

      <p>
        <Link href="/gallery" role="button">
          View the full gallery
        </Link>
      </p>
    </>
  )
}
