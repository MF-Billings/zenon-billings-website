import { render, screen } from '@testing-library/react'
import HomeHero from '@/components/HomeHero'

describe('HomeHero', () => {
  it('sets the artist name as the page heading, badged initial and all', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Zenon Billings' })).toBeInTheDocument()
    expect(container.querySelector('h1 .initial-badge')).toHaveTextContent(/^Z$/)
  })

  it('declares the heading as the page-level wordmark, so the header can stand down', () => {
    render(<HomeHero artistName="Zenon Billings" />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('data-site-wordmark')
  })

  it('shows the tagline beneath the name when there is one', () => {
    render(
      <HomeHero artistName="Zenon Billings" tagline="Watercolour, drawing, and photography." />,
    )
    expect(screen.getByText('Watercolour, drawing, and photography.')).toHaveClass('hero__tagline')
  })

  it('omits the tagline element entirely when there is none', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    expect(container.querySelector('.hero__tagline')).toBeNull()
  })
})
