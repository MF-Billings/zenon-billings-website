export type ContactMessage = {
  name: string
  email: string
  message: string
}

export type SubmitResult = { ok: true } | { ok: false; error: string }

export type ContactSubmitter = (message: ContactMessage) => Promise<SubmitResult>

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateContactMessage(message: ContactMessage): string[] {
  const errors: string[] = []

  if (!message.name.trim()) errors.push('Please enter your name.')
  if (!LOOKS_LIKE_EMAIL.test(message.email.trim()))
    errors.push('Please enter a valid email address.')
  if (!message.message.trim()) errors.push('Please enter a message.')

  return errors
}
