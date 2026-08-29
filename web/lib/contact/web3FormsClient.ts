import type { ContactSubmitter } from './submitContactMessage'

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

export const submitViaWeb3Forms: ContactSubmitter = async (message) => {
  // Public by design: Web3Forms access keys are meant to live in client-side code.
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY

  if (!accessKey) return { ok: false, error: 'The contact form is not configured yet.' }

  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Portfolio enquiry from ${message.name}`,
        name: message.name,
        email: message.email,
        message: message.message,
      }),
    })

    const result = (await response.json()) as { success: boolean; message?: string }

    if (!response.ok || !result.success) {
      return { ok: false, error: result.message ?? 'The message could not be sent.' }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not reach the mail service. Please try again.' }
  }
}
