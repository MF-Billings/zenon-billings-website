import { render, screen } from '@testing-library/react'
import ContactAliasLink from '@/components/ContactAliasLink'

const ALIAS = 'hello@example.com'

describe('ContactAliasLink', () => {
  it('offers the alias as a mailto link', () => {
    render(<ContactAliasLink alias={ALIAS} />)

    expect(screen.getByRole('link', { name: ALIAS })).toHaveAttribute('href', `mailto:${ALIAS}`)
  })

  it('renders nothing when no alias is published, so the page never shows a dead link', () => {
    const { container } = render(<ContactAliasLink alias={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
