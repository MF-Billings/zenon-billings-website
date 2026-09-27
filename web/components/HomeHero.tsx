import BrushstrokeLayer from '@/components/BrushstrokeLayer'
import InitialBadge from '@/components/InitialBadge'
import { brushstrokeWideMediaQuery } from '@/lib/brushstroke/brushstrokeWideBreakpoint'

type HomeHeroProps = {
  artistName: string
  tagline?: string | null
}

// Pixel sizes of the files in public/brushstrokes. They give the browser each
// file's aspect ratio before it loads; the home e2e checks them against the
// files themselves, so a re-export that forgets to update them fails a test.
const TREE = { src: '/brushstrokes/tree.webp', width: 386, height: 348 }
const TREES = { src: '/brushstrokes/trees.webp', width: 565, height: 462 }
const WATER = { src: '/brushstrokes/water.webp', width: 1677, height: 319 }

export default function HomeHero({ artistName, tagline }: HomeHeroProps) {
  return (
    <section className="hero">
      {/* First child, so the layer's static position is the hero's top edge:
          the tree hangs from the header rule. */}
      <BrushstrokeLayer>
        <picture>
          <source
            media={brushstrokeWideMediaQuery()}
            srcSet={TREES.src}
            width={TREES.width}
            height={TREES.height}
          />
          <img
            className="brushstroke hero__tree"
            src={TREE.src}
            width={TREE.width}
            height={TREE.height}
            alt=""
            decoding="async"
          />
        </picture>
      </BrushstrokeLayer>
      <hgroup>
        {/* The attribute tells the header this page already shows the site
            name large, so the header's own wordmark stands down. The header
            knows nothing about which page that is. */}
        <h1 className="hero__wordmark lowercase-chrome" data-site-wordmark="">
          <InitialBadge text={artistName} />
        </h1>
        {tagline && <p className="hero__tagline">{tagline}</p>}
      </hgroup>
      {/* After the heading group, so this layer hangs from the tagline. */}
      <BrushstrokeLayer>
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed static
            file with no renditions to pick from; next/image would add nothing. */}
        <img
          className="brushstroke hero__water"
          src={WATER.src}
          width={WATER.width}
          height={WATER.height}
          alt=""
          decoding="async"
          loading="lazy"
        />
      </BrushstrokeLayer>
    </section>
  )
}
