import { beforeEach, vi } from 'vitest'
import { submitViaWeb3Forms } from '@/lib/contact/web3FormsClient'

const message = { name: 'Ada', email: 'ada@example.com', message: 'Hello' }

describe('submitViaWeb3Forms', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubEnv('NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY', 'test-key')
  })

  it('posts the message and the access key to the Web3Forms endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await submitViaWeb3Forms(message)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.web3forms.com/submit')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toMatchObject({
      access_key: 'test-key',
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello',
    })
  })

  it('reports success when the service accepts the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }),
    )
    expect(await submitViaWeb3Forms(message)).toEqual({ ok: true })
  })

  it('surfaces the service message when it rejects the submission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, message: 'Invalid access key' }),
      }),
    )
    expect(await submitViaWeb3Forms(message)).toEqual({ ok: false, error: 'Invalid access key' })
  })

  it('falls back to a generic error when the service gives no message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ success: false }) }),
    )
    expect(await submitViaWeb3Forms(message)).toEqual({
      ok: false,
      error: 'The message could not be sent.',
    })
  })

  it('reports a friendly error when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await submitViaWeb3Forms(message)).toEqual({
      ok: false,
      error: 'Could not reach the mail service. Please try again.',
    })
  })

  it('fails loudly when the access key is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await submitViaWeb3Forms(message)).toEqual({
      ok: false,
      error: 'The contact form is not configured yet.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
