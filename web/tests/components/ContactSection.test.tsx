import { render, screen } from '@testing-library/react'
import ContactSection from '@/components/ContactSection'

describe('ContactSection', () => {
  it('is the anchor the nav points at', () => {
    render(<ContactSection />)
    expect(screen.getByRole('region', { name: 'Contact' })).toHaveAttribute('id', 'contact')
  })

  it('titles itself as a section of the page, not as the page', () => {
    render(<ContactSection />)
    expect(screen.getByRole('heading', { level: 2, name: 'Contact' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })

  it('holds the contact form', () => {
    render(<ContactSection />)
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('publishes the alias when one is configured', () => {
    render(<ContactSection alias="hello@example.com" />)
    expect(screen.getByRole('link', { name: 'hello@example.com' })).toHaveAttribute(
      'href',
      'mailto:hello@example.com',
    )
  })

  it('publishes no address when no alias is configured', () => {
    const { container } = render(<ContactSection />)
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull()
  })
})
