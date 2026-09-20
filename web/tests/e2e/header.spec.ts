import { expect, test } from '@playwright/test'

// The header's wordmark is pure CSS behaviour keyed on the page's own markup,
// so it can only be observed in a real browser with the stylesheet applied.
test.describe('header wordmark', () => {
  test('stands down on the home page, where the hero already carries the name', async ({
    page,
  }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    await expect(page.locator('.site-header__wordmark')).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/zenon billings/i)
  })

  test('keeps the nav links at the right edge once the wordmark is gone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const nav = await page.locator('.site-header__nav').boundingBox()
    const links = await page.locator('.site-header__links').boundingBox()

    expect(links!.x + links!.width).toBeCloseTo(nav!.x + nav!.width, 0)
  })

  test('shows the wordmark as plain text on every page without the hero', async ({ page }) => {
    for (const path of ['/gallery/', '/about/']) {
      await page.goto(path)
      const wordmark = page.locator('.site-header__wordmark')
      await expect(wordmark).toBeVisible()
      await expect(wordmark).toHaveText('Zenon Billings')
      await expect(page.getByRole('link', { name: 'Zenon Billings' })).toHaveCount(0)
      await expect(page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    }
  })

  // The wordmark's line box sets the nav row's height. Taking it out of
  // layout on the home page let the row shrink, so the rule beneath the header
  // sat higher there than on every other page and visibly jumped between them.
  test('draws the header rule at the same height on every page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    const ruleTop = async (path: string) => {
      await page.goto(path)
      await page.evaluate(() => document.fonts.ready)
      return (await page.locator('.site-header__rule').boundingBox())!.y
    }

    expect(await ruleTop('/')).toBeCloseTo(await ruleTop('/gallery/'), 0)
  })
})
