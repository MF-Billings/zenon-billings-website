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

  describe('site name', () => {
    it('links home under the full, unbroken name', () => {
      render(<SiteHeader />)
      // The initial is wrapped for styling; that must not split the accessible name.
      expect(screen.getByRole('link', { name: 'Zenon Billings' })).toHaveAttribute('href', '/')
    })

    it('wraps only the first letter in the styled initial', () => {
      const { container } = render(<SiteHeader />)
      const initial = container.querySelector('.site-name__initial')
      expect(initial).toHaveTextContent(/^Z$/)
      expect(initial?.parentElement).toHaveClass('site-name')
    })
  })
})
