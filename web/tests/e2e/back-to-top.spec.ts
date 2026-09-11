import { expect, test } from '@playwright/test'

// jsdom can prove the button asks for a smooth scroll and reacts to a faked
// observer; only a real browser can prove the page actually glides and that
// the observer fires when the search input really leaves the viewport.
test.describe('back to top', () => {
  test('appears only after the search input has scrolled out of view', async ({ page }) => {
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)

    const button = page.getByRole('button', { name: /back to top/i })
    await expect(button).toBeHidden()

    await page.locator('.site-footer').scrollIntoViewIfNeeded()
    await expect(button).toBeVisible()
  })

  test('glides up through intermediate positions and then hides again', async ({ page }) => {
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.site-footer').scrollIntoViewIfNeeded()

    const start = await page.evaluate(() => window.scrollY)
    expect(start).toBeGreaterThan(0)

    // A jump would fire a single scroll event that lands at 0, so the proof of a
    // glide is a recorded position strictly between the start and the top.
    await page.evaluate(() => {
      const positions: number[] = []
      window.addEventListener('scroll', () => positions.push(window.scrollY))
      Object.assign(window, { scrollPositions: positions })
    })

    const button = page.getByRole('button', { name: /back to top/i })
    await button.click()

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect(button).toBeHidden()

    const positions = await page.evaluate(
      () => (window as unknown as { scrollPositions: number[] }).scrollPositions,
    )
    expect(positions.some((y) => y > 0 && y < start)).toBe(true)
  })
})
