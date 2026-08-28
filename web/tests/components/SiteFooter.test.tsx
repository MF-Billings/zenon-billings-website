import { render, screen } from '@testing-library/react'
import SiteFooter from '@/components/SiteFooter'

describe('SiteFooter', () => {
  it('shows the current year so the copyright never goes stale', () => {
    render(<SiteFooter />)
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument()
  })

  it('exposes the footer as a landmark', () => {
    render(<SiteFooter />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
