import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import BackToTopButton from '@/components/BackToTopButton'

describe('BackToTopButton', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is named for screen readers even though it shows only an icon', () => {
    render(<BackToTopButton visible />)
    const button = screen.getByRole('button', { name: /back to top/i })
    expect(button).toHaveTextContent('')
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('stays out of the way while not visible', () => {
    render(<BackToTopButton visible={false} />)
    expect(screen.getByLabelText(/back to top/i)).not.toBeVisible()
  })

  it('scrolls the window to the top with a visible, smooth motion', async () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)

    render(<BackToTopButton visible />)
    await userEvent.click(screen.getByRole('button', { name: /back to top/i }))

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
  })

  it('releases focus on click so hiding it mid-glide cannot cancel the scroll', async () => {
    vi.stubGlobal('scrollTo', vi.fn())

    render(<BackToTopButton visible />)
    const button = screen.getByRole('button', { name: /back to top/i })
    await userEvent.click(button)

    expect(button).not.toHaveFocus()
  })
})
