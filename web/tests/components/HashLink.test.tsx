import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import HashLink from '@/components/HashLink'

describe('HashLink', () => {
  const originalUrl = window.location.href

  afterEach(() => {
    window.history.replaceState(null, '', originalUrl)
    document.body.innerHTML = ''
  })

  const renderWithTarget = () => {
    const target = document.createElement('section')
    target.id = 'contact'
    target.scrollIntoView = vi.fn()
    document.body.appendChild(target)
    render(<HashLink href="/#contact">Contact</HashLink>)
    return target
  }

  it('renders a plain link to its target', () => {
    render(<HashLink href="/#contact">Contact</HashLink>)
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/#contact')
  })

  it('scrolls the target back into view when the page is already at that URL', async () => {
    window.history.replaceState(null, '', '/#contact')
    const target = renderWithTarget()

    await userEvent.click(screen.getByRole('link', { name: 'Contact' }))

    expect(target.scrollIntoView).toHaveBeenCalled()
  })

  it('leaves the navigation to the router when the URL is different', async () => {
    window.history.replaceState(null, '', '/gallery/')
    const target = renderWithTarget()

    await userEvent.click(screen.getByRole('link', { name: 'Contact' }))

    expect(target.scrollIntoView).not.toHaveBeenCalled()
  })

  it('still calls any click handler it was given', async () => {
    window.history.replaceState(null, '', '/#contact')
    const onClick = vi.fn()
    render(
      <HashLink href="/#contact" onClick={onClick}>
        Contact
      </HashLink>,
    )

    await userEvent.click(screen.getByRole('link', { name: 'Contact' }))

    expect(onClick).toHaveBeenCalled()
  })
})
