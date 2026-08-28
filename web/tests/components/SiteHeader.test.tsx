import { render, screen } from '@testing-library/react'
import SiteHeader from '@/components/SiteHeader'

describe('SiteHeader', () => {
  it('links to every top-level section', () => {
    render(<SiteHeader />)

    expect(screen.getByRole('link', { name: /gallery/i })).toHaveAttribute('href', '/gallery')
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact')
  })

  it('exposes the navigation as a landmark', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
