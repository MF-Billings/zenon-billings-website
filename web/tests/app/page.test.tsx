import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('@/lib/sanity/client', () => ({
  projectId: 'test',
  dataset: 'test',
  client: {
    fetch: vi.fn((query: string) =>
      Promise.resolve(
        query.includes('siteSettings')
          ? {
              artistName: 'Zenon Billings',
              statement: [
                {
                  _type: 'block',
                  _key: 'b1',
                  style: 'normal',
                  markDefs: [],
                  children: [{ _type: 'span', _key: 's1', text: 'I paint slowly.', marks: [] }],
                },
              ],
            }
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

  it('sets the statement between the gallery button and the contact section', async () => {
    const { container } = render(await HomePage())
    const order = Array.from(container.querySelectorAll('.home-cta, .statement, .contact'))
    expect(order.map((element) => element.className.split(' ')[0])).toEqual([
      'home-cta',
      'statement',
      'contact',
    ])
    expect(screen.getByText('I paint slowly.')).toBeInTheDocument()
  })

  it('offers a way back to the top of what is now a long page', async () => {
    render(await HomePage())
    expect(screen.getByLabelText(/back to top/i)).toBeInTheDocument()
  })
})
