import Link from 'next/link'
import ArtworkGrid from '@/components/ArtworkGrid'
import BackToTopSentinel from '@/components/BackToTopSentinel'
import ContactSection from '@/components/ContactSection'
import HomeHero from '@/components/HomeHero'
import InkRule from '@/components/InkRule'
import StatementSection from '@/components/StatementSection'
import { client } from '@/lib/sanity/client'
import { FEATURED_ARTWORKS_QUERY, SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'

export default async function HomePage() {
  const [featured, settings] = await Promise.all([
    client.fetch(FEATURED_ARTWORKS_QUERY),
    client.fetch(SITE_SETTINGS_QUERY),
  ])

  return (
    <>
      <HomeHero artistName={settings?.artistName ?? 'Zenon Billings'} tagline={settings?.tagline} />
      {/* Below the hero, so the button appears once the name has scrolled away. */}
      <BackToTopSentinel />

      <section className="home-featured">
        <h2 className="lowercase-chrome">Featured work</h2>
        <InkRule className="home-featured__rule" />
        <ArtworkGrid
          artworks={featured}
          emptyMessage="No featured artwork yet — browse the full gallery below."
        />
      </section>

      <p className="home-cta">
        <Link href="/gallery" role="button" className="button-pigment lowercase-chrome">
          View the full gallery
        </Link>
      </p>

      <StatementSection
        artistName={settings?.artistName ?? 'Zenon Billings'}
        statement={settings?.statement ?? null}
        heading={settings?.statementHeading}
        image={settings?.statementImage}
        attribution={settings?.statementAttribution}
      />

      <ContactSection />
    </>
  )
}
