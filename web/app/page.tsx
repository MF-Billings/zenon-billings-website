import Link from 'next/link'
import ArtworkGrid from '@/components/ArtworkGrid'
import InkRule from '@/components/InkRule'
import WashBloom from '@/components/WashBloom'
import { client } from '@/lib/sanity/client'
import { FEATURED_ARTWORKS_QUERY, SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'

export default async function HomePage() {
  const [featured, settings] = await Promise.all([
    client.fetch(FEATURED_ARTWORKS_QUERY),
    client.fetch(SITE_SETTINGS_QUERY),
  ])

  return (
    <>
      <section className="hero paper-sheet--deckle">
        <WashBloom pigment="watercolour" className="hero__bloom" />
        <hgroup className="hero__group">
          <h1 className="hero__wordmark lowercase-chrome">
            {settings?.artistName ?? 'Zenon Billings'}
          </h1>
          {settings?.tagline && <p className="hero__tagline">{settings.tagline}</p>}
        </hgroup>
      </section>

      <section className="home-featured">
        <h2 className="lowercase-chrome">Featured work</h2>
        <InkRule className="home-featured__rule" />
        <ArtworkGrid
          artworks={featured}
          emptyMessage="No featured artwork yet — browse the full gallery below."
        />
      </section>

      <p className="home-cta">
        <Link href="/gallery" role="button" className="lowercase-chrome">
          View the full gallery
        </Link>
      </p>
    </>
  )
}
