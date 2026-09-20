import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/lib/sanity/client', () => ({
  projectId: 'test',
  dataset: 'test',
  client: {
    fetch: vi.fn((query: string) =>
      Promise.resolve(
        query.includes('siteSettings')
          ? { artistName: 'Zenon Billings', publicContactAlias: 'hello@example.com' }
          : [],
      ),
    ),
  },
}))

const { default: HomePage } = await import('@/app/page')

describe('HomePage', () => {
  it('carries the contact section, reachable by anchor', async () => {
    render(await HomePage())
    expect(screen.getByRole('region', { name: 'Contact' })).toHaveAttribute('id', 'contact')
  })

  it('hands the published alias to the contact section', async () => {
    render(await HomePage())
    expect(screen.getByRole('link', { name: 'hello@example.com' })).toBeInTheDocument()
  })

  it('offers a way back to the top of what is now a long page', async () => {
    render(await HomePage())
    expect(screen.getByLabelText(/back to top/i)).toBeInTheDocument()
  })
})
