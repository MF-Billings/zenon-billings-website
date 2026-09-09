import { expect, test } from '@playwright/test'

test.describe('artwork detail', () => {
  test('opens from the gallery and carries valid JSON-LD', async ({ page }) => {
    await page.goto('/gallery/')

    const title = await page.locator('.artwork-card h3').first().innerText()
    await page.locator('.artwork-card a').first().click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)

    const raw = await page.locator('script[type="application/ld+json"]').innerText()
    const jsonLd = JSON.parse(raw)
    expect(jsonLd['@type']).toBe('VisualArtwork')
    expect(jsonLd.name).toBe(title)
    expect(jsonLd.creator['@type']).toBe('Person')
  })

  test('states dimensions as QuantitativeValue when known', async ({ page }) => {
    await page.goto('/artwork/seated-giant-334002/')

    const jsonLd = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText())
    expect(jsonLd.width).toMatchObject({ '@type': 'QuantitativeValue', unitCode: 'CMT' })
    expect(jsonLd.height).toMatchObject({ '@type': 'QuantitativeValue', unitCode: 'CMT' })

    await expect(page.getByText(/× .* cm/)).toBeVisible()
  })

  test('serves an image with responsive candidates and real alt text', async ({ page }) => {
    await page.goto('/gallery/')
    await page.locator('.artwork-card a').first().click()

    const image = page.locator('article img').first()
    await expect(image).toHaveAttribute('srcset', /\d+w/)
    await expect(image).toHaveAttribute('alt', /.+/)
    await expect(image).toHaveAttribute('loading', 'eager')
  })

  test('titles the tab with the artwork name', async ({ page }) => {
    await page.goto('/artwork/seated-giant-334002/')
    await expect(page).toHaveTitle(/Seated Giant \| Zenon Billings/)
  })
})
