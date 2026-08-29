import { validateContactMessage } from '@/lib/contact/submitContactMessage'

const valid = { name: 'Ada', email: 'ada@example.com', message: 'I love the river piece.' }

describe('validateContactMessage', () => {
  it('accepts a complete message', () => {
    expect(validateContactMessage(valid)).toEqual([])
  })

  it('requires a name', () => {
    expect(validateContactMessage({ ...valid, name: '  ' })).toContain('Please enter your name.')
  })

  it('requires a message', () => {
    expect(validateContactMessage({ ...valid, message: '' })).toContain('Please enter a message.')
  })

  it('requires an email that looks like an address', () => {
    expect(validateContactMessage({ ...valid, email: 'not-an-email' })).toContain(
      'Please enter a valid email address.',
    )
  })

  it('rejects an address with spaces or a missing domain', () => {
    expect(validateContactMessage({ ...valid, email: 'ada@' })).toHaveLength(1)
    expect(validateContactMessage({ ...valid, email: 'a b@example.com' })).toHaveLength(1)
  })

  it('reports every problem at once rather than one at a time', () => {
    expect(validateContactMessage({ name: '', email: '', message: '' })).toHaveLength(3)
  })
})
