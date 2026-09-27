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

  it('publishes no email address, so scrapers find nothing to harvest', () => {
    const { container } = render(<ContactSection />)
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull()
  })
})
