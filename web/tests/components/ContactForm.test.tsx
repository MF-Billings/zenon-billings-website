import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import ContactForm from '@/components/ContactForm'

const fillIn = async () => {
  await userEvent.type(screen.getByLabelText(/name/i), 'Ada')
  await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com')
  await userEvent.type(screen.getByLabelText(/message/i), 'I love the river piece.')
}

describe('ContactForm', () => {
  it('sends the message through the injected submitter', async () => {
    const submit = vi.fn().mockResolvedValue({ ok: true })
    render(<ContactForm submit={submit} />)

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(submit).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'I love the river piece.',
    })
  })

  it('confirms to the visitor that the message was sent', async () => {
    render(<ContactForm submit={vi.fn().mockResolvedValue({ ok: true })} />)

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/thank you/i)
  })

  it('shows validation errors and never calls the submitter', async () => {
    const submit = vi.fn()
    render(<ContactForm submit={submit} />)

    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/please enter your name/i)
    expect(submit).not.toHaveBeenCalled()
  })

  it('surfaces the error when the service rejects the message', async () => {
    render(<ContactForm submit={vi.fn().mockResolvedValue({ ok: false, error: 'Service down' })} />)

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Service down')
  })

  it('silently drops submissions that fill the honeypot, since only bots see it', async () => {
    const submit = vi.fn()
    const { container } = render(<ContactForm submit={submit} />)

    await fillIn()
    const honeypot = container.querySelector('input[name="botcheck"]') as HTMLInputElement
    await userEvent.type(honeypot, 'spam')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(submit).not.toHaveBeenCalled()
  })

  it('keeps the honeypot out of the tab order and away from autofill', () => {
    const { container } = render(<ContactForm submit={vi.fn()} />)
    const honeypot = container.querySelector('input[name="botcheck"]') as HTMLInputElement

    expect(honeypot).toHaveAttribute('tabindex', '-1')
    expect(honeypot).toHaveAttribute('autocomplete', 'off')
  })

  it('clears the fields after a successful send', async () => {
    render(<ContactForm submit={vi.fn().mockResolvedValue({ ok: true })} />)

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    await screen.findByRole('status')

    expect(screen.getByLabelText(/name/i)).toHaveValue('')
  })

  it('disables the button while sending so a message cannot be sent twice', async () => {
    let release: (value: { ok: true }) => void = () => {}
    const submit = vi.fn().mockReturnValue(
      new Promise<{ ok: true }>((resolve) => {
        release = resolve
      }),
    )
    render(<ContactForm submit={submit} />)

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
    release({ ok: true })
  })
})
