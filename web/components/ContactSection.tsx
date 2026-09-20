import ContactAliasLink from '@/components/ContactAliasLink'
import ContactForm from '@/components/ContactForm'

export default function ContactSection({ alias }: { alias?: string | null }) {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="lowercase-chrome">
        Contact
      </h2>

      <div className="paper-sheet contact__sheet">
        <ContactForm />
      </div>

      <ContactAliasLink alias={alias} />
    </section>
  )
}
