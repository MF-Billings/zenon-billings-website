import ContactForm from '@/components/ContactForm'

export default function ContactSection() {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-heading">
      <h2 id="contact-heading" className="lowercase-chrome">
        Contact
      </h2>

      <div className="paper-sheet contact__sheet">
        <ContactForm />
      </div>
    </section>
  )
}
