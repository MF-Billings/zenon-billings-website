'use client'

import { useState, type FormEvent } from 'react'
import {
  validateContactMessage,
  type ContactMessage,
  type ContactSubmitter,
} from '@/lib/contact/submitContactMessage'
import { submitViaWeb3Forms } from '@/lib/contact/web3FormsClient'

const EMPTY_MESSAGE: ContactMessage = { name: '', email: '', message: '' }

export default function ContactForm({
  submit = submitViaWeb3Forms,
}: {
  submit?: ContactSubmitter
}) {
  const [message, setMessage] = useState(EMPTY_MESSAGE)
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const update = (field: keyof ContactMessage) => (event: { target: { value: string } }) =>
    setMessage((current) => ({ ...current, [field]: event.target.value }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // A real visitor never sees this field, so anything in it came from a bot.
    if (honeypot) return

    const validationErrors = validateContactMessage(message)
    setErrors(validationErrors)
    if (validationErrors.length > 0) return

    setSent(false)
    setSending(true)
    const result = await submit(message)
    setSending(false)

    if (result.ok) {
      setSent(true)
      setMessage(EMPTY_MESSAGE)
    } else {
      setErrors([result.error])
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {sent && <p role="status">Thank you — your message is on its way.</p>}

      {errors.length > 0 && (
        <div role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <label htmlFor="contact-name" className="studio-label">
        Name
      </label>
      <input
        id="contact-name"
        className="field-ruled"
        value={message.name}
        onChange={update('name')}
        autoComplete="name"
      />

      <label htmlFor="contact-email" className="studio-label">
        Email
      </label>
      <input
        id="contact-email"
        type="email"
        className="field-ruled"
        value={message.email}
        onChange={update('email')}
        autoComplete="email"
      />

      <label htmlFor="contact-message" className="studio-label">
        Message
      </label>
      <textarea
        id="contact-message"
        rows={5}
        className="field-ruled"
        value={message.message}
        onChange={update('message')}
      />

      <input
        type="text"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="visually-hidden"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
      />

      <button type="submit" className="button-pigment" aria-busy={sending} disabled={sending}>
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
