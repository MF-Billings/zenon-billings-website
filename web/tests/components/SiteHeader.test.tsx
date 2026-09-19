import { render, screen } from '@testing-library/react'
import SiteHeader from '@/components/SiteHeader'

describe('SiteHeader', () => {
  it('links to every top-level section', () => {
    render(<SiteHeader />)

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /gallery/i })).toHaveAttribute('href', '/gallery')
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact')
  })

  it('lists home first, alongside the other sections', () => {
    render(<SiteHeader />)
    const items = screen.getByRole('list').querySelectorAll('li')
    expect(items[0]).toHaveTextContent(/^home$/i)
  })

  it('exposes the navigation as a landmark', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('marks the wordmark as chrome, which is what makes it lowercase', () => {
    const { container } = render(<SiteHeader />)
    expect(container.querySelector('.site-header__wordmark')).toHaveClass('lowercase-chrome')
  })

  it('draws the rule beneath the nav', () => {
    const { container } = render(<SiteHeader />)
    expect(container.querySelector('.ink-rule')).toBeInTheDocument()
  })

  describe('wordmark initial', () => {
    it('shows the full, unbroken name without linking it', () => {
      const { container } = render(<SiteHeader />)
      const wordmark = container.querySelector('.site-header__wordmark')
      // The initial is wrapped for styling; that must not split the name.
      expect(wordmark).toHaveTextContent(/^Zenon Billings$/)
      expect(wordmark?.tagName).not.toBe('A')
      expect(wordmark).not.toHaveAttribute('href')
      expect(screen.queryByRole('link', { name: 'Zenon Billings' })).not.toBeInTheDocument()
    })

    it('wraps only the first letter in the styled initial', () => {
      const { container } = render(<SiteHeader />)
      const initial = container.querySelector('.initial-badge')
      expect(initial).toHaveTextContent(/^Z$/)
      expect(initial?.parentElement).toHaveClass('site-header__wordmark')
    })
  })
})
