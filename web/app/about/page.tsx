import type { Metadata } from 'next'
import { PortableText } from 'next-sanity'
import SanityImage from '@/components/SanityImage'
import { client } from '@/lib/sanity/client'
import { SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'About',
  description: 'About the artist.',
}

export default async function AboutPage() {
  const settings = await client.fetch(SITE_SETTINGS_QUERY)

  return (
    <div className="about">
      <h1 className="lowercase-chrome">About {settings?.artistName ?? 'the artist'}</h1>

      <div className="about__spread">
        {settings?.profileImage && (
          <figure className="paper-sheet about__portrait">
            <SanityImage
              source={settings.profileImage}
              alt={`Portrait of ${settings.artistName ?? 'the artist'}`}
              widths={[300, 600]}
              sizes="(max-width: 600px) 100vw, 300px"
              className="profile-image"
            />
          </figure>
        )}

        <div className="about__bio">
          {settings?.bio ? <PortableText value={settings.bio} /> : <p>Biography coming soon.</p>}
        </div>
      </div>
    </div>
  )
}
