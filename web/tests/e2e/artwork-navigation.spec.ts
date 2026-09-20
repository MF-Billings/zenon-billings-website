import { expect, test, type Page } from '@playwright/test'

const previousButton = (page: Page) => page.getByRole('button', { name: /previous artwork/i })
const nextButton = (page: Page) => page.getByRole('button', { name: /next artwork/i })

test.describe('artwork navigation', () => {
  test('walks the gallery in display order from the first artwork', async ({ page }) => {
    await page.goto('/gallery/')
    const titles = await page.locator('.artwork-card h3').allInnerTexts()
    test.skip(titles.length < 2, 'need at least two artworks to navigate between')

    await page.locator('.artwork-card a').first().click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles[0])

    // First in the collection: nothing to go back to.
    await expect(previousButton(page)).toHaveCount(0)

    await nextButton(page).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles[1])

    await previousButton(page).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles[0])
  })

  test('hides the next button on the last artwork', async ({ page }) => {
    await page.goto('/gallery/')
    const titles = await page.locator('.artwork-card h3').allInnerTexts()

    await page.locator('.artwork-card a').last().click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles[titles.length - 1])

    await expect(nextButton(page)).toHaveCount(0)
    await expect(previousButton(page)).toBeVisible()
  })

  test('keeps walking the tag-filtered set chosen in the gallery', async ({ page }) => {
    await page.goto('/gallery/')

    const firstTag = page.getByRole('checkbox').first()
    await firstTag.check()
    await expect(page).toHaveURL(/[?&]tags=/)

    const filteredTitles = await page.locator('.artwork-card h3').allInnerTexts()
    test.skip(filteredTitles.length < 2, 'first tag does not cover two artworks in this dataset')

    await page.locator('.artwork-card a').first().click()
    await expect(page).toHaveURL(/[?&]tags=/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(filteredTitles[0])

    await nextButton(page).click()
    await expect(page).toHaveURL(/[?&]tags=/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(filteredTitles[1])
  })

  test('centres the arrow inside its circle', async ({ page }) => {
    await page.goto('/gallery/')
    await page.locator('.artwork-card a').first().click()
    await page.evaluate(() => document.fonts.ready)

    const button = nextButton(page)
    const buttonBox = (await button.boundingBox())!
    const arrowBox = (await button.locator('svg').boundingBox())!

    const centre = (box: { x: number; y: number; width: number; height: number }) => ({
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    })
    expect(Math.abs(centre(arrowBox).x - centre(buttonBox).x)).toBeLessThan(1)
    expect(Math.abs(centre(arrowBox).y - centre(buttonBox).y)).toBeLessThan(1)
    // Large enough to read as the control's purpose, not a speck in a disc.
    expect(arrowBox.width / buttonBox.width).toBeGreaterThan(0.5)
  })

  // Flanking the picture at mid-height is the lightbox convention, and it holds at
  // every width: the buttons must never sit under the sheet on a wide screen either.
  for (const viewport of [
    { name: 'phone', width: 390, height: 844 },
    { name: 'desktop', width: 1280, height: 900 },
  ]) {
    test(`on ${viewport.name}, sits beside the artwork at mid-height without covering it`, async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      })
      const page = await context.newPage()
      await page.goto('/gallery/')
      const titles = await page.locator('.artwork-card h3').allInnerTexts()
      test.skip(titles.length < 3, 'need an artwork with a neighbour on each side')
      await page.locator('.artwork-card a').nth(1).click()
      await page.evaluate(() => document.fonts.ready)

      const image = (await page.locator('.artwork-detail__image').boundingBox())!
      const imageMidY = image.y + image.height / 2

      for (const button of [previousButton(page), nextButton(page)]) {
        const box = (await button.boundingBox())!
        const overlapsImage =
          box.x < image.x + image.width &&
          box.x + box.width > image.x &&
          box.y < image.y + image.height &&
          box.y + box.height > image.y
        expect(overlapsImage).toBe(false)
        expect(Math.abs(box.y + box.height / 2 - imageMidY)).toBeLessThan(2)
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      }
      await context.close()
    })
  }

  test('prerenders the unfiltered buttons so they work without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/gallery/')
    await page.locator('.artwork-card a').first().click()

    await expect(nextButton(page)).toBeVisible()
    await context.close()
  })
})
