import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'
import { client } from '@/lib/sanity/client'
import { SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch about a piece.',
}

export default async function ContactPage() {
  const settings = await client.fetch(SITE_SETTINGS_QUERY)

  return (
    <>
      <h1>Contact</h1>

      <ContactForm />

      {settings?.contactEmail && (
        <p>
          Prefer your own mail client?{' '}
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
        </p>
      )}
    </>
  )
}
