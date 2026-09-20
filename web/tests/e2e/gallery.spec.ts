import { expect, test } from '@playwright/test'

// The titles come from Sanity and differ between datasets, so the search term
// is taken from the page: a word that appears in some titles but not all, so
// that searching for it must narrow the gallery without emptying it.
const narrowingTerm = (titles: string[]) => {
  const lowered = titles.map((title) => title.toLowerCase())
  const words = lowered.flatMap((title) => title.match(/[a-z]{4,}/g) ?? [])
  return words.find((word) => {
    const matching = lowered.filter((title) => title.includes(word)).length
    return matching > 0 && matching < titles.length
  })
}

test.describe('gallery', () => {
  test('lists artwork and narrows it in the browser', async ({ page }) => {
    await page.goto('/gallery/')

    const cards = page.locator('.artwork-card')
    const initialCount = await cards.count()
    expect(initialCount).toBeGreaterThan(1)

    const term = narrowingTerm(await cards.locator('h3').allInnerTexts())
    test.skip(term === undefined, 'no title word narrows this dataset')

    // Several works may share the term, so assert that every remaining card
    // matches it rather than that exactly one survives.
    await page.getByRole('searchbox', { name: /search/i }).fill(term!)

    const remaining = await cards.count()
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThan(initialCount)

    for (const title of await cards.locator('h3').allInnerTexts()) {
      expect(title.toLowerCase()).toContain(term!)
    }
  })

  test('reports how many of the total are showing', async ({ page }) => {
    await page.goto('/gallery/')
    await expect(page.getByRole('status')).toContainText(/Showing \d+ of \d+/)
  })

  test('explains an empty result rather than going blank', async ({ page }) => {
    await page.goto('/gallery/')
    await page.getByRole('searchbox', { name: /search/i }).fill('zzzznotathing')

    await expect(page.getByText(/no artwork matches/i)).toBeVisible()
    await expect(page.locator('.artwork-card')).toHaveCount(0)
  })

  test('filters by tag and restores on deselect', async ({ page }) => {
    await page.goto('/gallery/')
    const cards = page.locator('.artwork-card')
    const total = await cards.count()

    const firstTag = page.getByRole('checkbox').first()
    await firstTag.check()
    const filtered = await cards.count()
    expect(filtered).toBeGreaterThan(0)
    expect(filtered).toBeLessThanOrEqual(total)

    await firstTag.uncheck()
    await expect(cards).toHaveCount(total)
  })

  test('works without JavaScript for the initial render', async ({ browser }) => {
    // The whole point of the static export: content is in the HTML, not fetched.
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/gallery/')

    expect(await page.locator('.artwork-card').count()).toBeGreaterThan(1)
    await context.close()
  })
})
