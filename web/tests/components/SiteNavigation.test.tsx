import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SiteNavigation from '@/components/SiteNavigation'

describe('SiteNavigation', () => {
  it('links to every top-level section', () => {
    render(<SiteNavigation />)

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /gallery/i })).toHaveAttribute('href', '/gallery')
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/#contact')
  })

  describe('menu toggle', () => {
    it('is named for screen readers even though it shows only an icon', () => {
      render(<SiteNavigation />)
      const toggle = screen.getByRole('button', { name: /menu/i })
      expect(toggle).toHaveTextContent('')
      expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    })

    it('starts closed and points at the list it controls', () => {
      render(<SiteNavigation />)
      const toggle = screen.getByRole('button', { name: /menu/i })
      const list = screen.getByRole('list')

      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(list).toHaveAttribute('id')
      expect(toggle).toHaveAttribute('aria-controls', list.id)
    })

    it('opens and closes on each press', async () => {
      render(<SiteNavigation />)
      const toggle = screen.getByRole('button', { name: /menu/i })

      await userEvent.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')

      await userEvent.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
    })

    // The stylesheet only shows the list on a phone while the menu is open, so
    // the list carries the same state in markup the CSS can key on.
    it('marks the list open so the stylesheet can show it', async () => {
      render(<SiteNavigation />)
      const list = screen.getByRole('list')

      expect(list).not.toHaveAttribute('data-open')
      await userEvent.click(screen.getByRole('button', { name: /menu/i }))
      expect(list).toHaveAttribute('data-open')
    })

    // The open menu is a panel laid over the page, so the visitor needs the
    // usual ways out of an overlay without finding the toggle again.
    it('closes on Escape', async () => {
      render(<SiteNavigation />)
      const toggle = screen.getByRole('button', { name: /menu/i })

      await userEvent.click(toggle)
      await userEvent.keyboard('{Escape}')

      expect(toggle).toHaveAttribute('aria-expanded', 'false')
    })

    it('closes on a press outside the menu', async () => {
      render(
        <>
          <SiteNavigation />
          <p>elsewhere on the page</p>
        </>,
      )
      const toggle = screen.getByRole('button', { name: /menu/i })

      await userEvent.click(toggle)
      await userEvent.click(screen.getByText(/elsewhere/))

      expect(toggle).toHaveAttribute('aria-expanded', 'false')
    })

    it('stays open on a press inside the menu that is not a link', async () => {
      render(<SiteNavigation />)
      const toggle = screen.getByRole('button', { name: /menu/i })

      await userEvent.click(toggle)
      await userEvent.click(screen.getByRole('list'))

      expect(toggle).toHaveAttribute('aria-expanded', 'true')
    })

    it('closes again once a link is chosen', async () => {
      render(<SiteNavigation />)
      const toggle = screen.getByRole('button', { name: /menu/i })

      await userEvent.click(toggle)
      await userEvent.click(screen.getByRole('link', { name: /gallery/i }))

      expect(toggle).toHaveAttribute('aria-expanded', 'false')
    })
  })
})
