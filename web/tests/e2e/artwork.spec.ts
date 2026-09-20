import { readdirSync, readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// Slugs come from Sanity and differ between datasets, so the fixture is read
// from the build rather than hardcoded: the first artwork page whose JSON-LD
// states its dimensions.
const measuredArtworkPath = () => {
  for (const slug of readdirSync('out/artwork').sort()) {
    const html = readFileSync(`out/artwork/${slug}/index.html`, 'utf8')
    if (html.includes('"unitCode":"CMT"')) return `/artwork/${slug}/`
  }
  return null
}

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
    const path = measuredArtworkPath()
    test.skip(path === null, 'no artwork in this build states its dimensions')
    await page.goto(path!)

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

  test('never renders the image wider than its source pixels', async ({ page }) => {
    await page.goto('/gallery/')
    await page.locator('.artwork-card a').first().click()

    const image = page.locator('article img').first()
    await expect(image).toBeVisible()
    await image.evaluate((img: HTMLImageElement) => img.decode())

    const { rendered, natural } = await image.evaluate((img: HTMLImageElement) => ({
      rendered: img.getBoundingClientRect().width,
      natural: img.naturalWidth,
    }))
    expect(natural).toBeGreaterThan(0)
    expect(rendered).toBeLessThanOrEqual(natural)
  })

  test('titles the tab with the artwork name', async ({ page }) => {
    await page.goto('/gallery/')
    await page.locator('.artwork-card a').first().click()
    await page.waitForURL(/\/artwork\//)

    const name = await page.getByRole('heading', { level: 1 }).innerText()
    await expect(page).toHaveTitle(`${name} | Zenon Billings`)
  })
})
