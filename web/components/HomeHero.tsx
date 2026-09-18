import InitialBadge from '@/components/InitialBadge'
import WashBloom from '@/components/WashBloom'

type HomeHeroProps = {
  artistName: string
  tagline?: string | null
}

export default function HomeHero({ artistName, tagline }: HomeHeroProps) {
  return (
    <section className="hero">
      <WashBloom pigment="watercolour" className="hero__bloom" />
      <hgroup>
        {/* The attribute tells the header this page already shows the site
            name large, so the header's own wordmark stands down. The header
            knows nothing about which page that is. */}
        <h1 className="hero__wordmark lowercase-chrome" data-site-wordmark="">
          <InitialBadge text={artistName} />
        </h1>
        {tagline && <p className="hero__tagline">{tagline}</p>}
      </hgroup>
    </section>
  )
}
