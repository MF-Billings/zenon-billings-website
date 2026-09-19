import type { Metadata } from 'next'
import ContactAliasLink from '@/components/ContactAliasLink'
import ContactForm from '@/components/ContactForm'
import { client } from '@/lib/sanity/client'
import { SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the artist.',
}

export default async function ContactPage() {
  const settings = await client.fetch(SITE_SETTINGS_QUERY)

  return (
    <div className="page contact">
      <h1 className="lowercase-chrome">Contact</h1>

      <div className="paper-sheet contact__sheet">
        <ContactForm />
      </div>

      <ContactAliasLink alias={settings?.publicContactAlias} />
    </div>
  )
}
