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

// The row of tags is the one thing on the placard that is not running prose,
// so it is where an unbreakable run of text would first show. The artwork with
// the most tags is the fixture that stresses it hardest.
const mostTaggedArtworkPath = () => {
  let best: { path: string; count: number } | null = null
  for (const slug of readdirSync('out/artwork').sort()) {
    const html = readFileSync(`out/artwork/${slug}/index.html`, 'utf8')
    const row = html.match(/class="artwork-tags"[^>]*>([\s\S]*?)<\/(?:p|ul)>/)
    const count = row ? (row[1].match(/<(?:mark|li)\b/g) ?? []).length : 0
    if (count > 0 && (!best || count > best.count)) best = { path: `/artwork/${slug}/`, count }
  }
  return best?.path ?? null
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

  // A long row of tags widened the whole artwork column on a phone, carrying the
  // image and the artist's note off the right edge of the screen with it. The
  // tags have to wrap within the column instead.
  test('wraps a long row of tags within the column on a phone', async ({ page }) => {
    const path = mostTaggedArtworkPath()
    test.skip(path === null, 'no artwork in this build carries tags')
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(path!)
    await page.evaluate(() => document.fonts.ready)

    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth)
    const placard = await page.locator('.artwork-detail__placard').boundingBox()
    expect(placard!.x + placard!.width).toBeLessThanOrEqual(viewportWidth)

    for (const tag of await page.locator('.artwork-tags > *').all()) {
      const box = await tag.boundingBox()
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth)
    }
  })

  test('titles the tab with the artwork name', async ({ page }) => {
    await page.goto('/gallery/')
    await page.locator('.artwork-card a').first().click()
    await page.waitForURL(/\/artwork\//)

    const name = await page.getByRole('heading', { level: 1 }).innerText()
    await expect(page).toHaveTitle(`${name} | Zenon Billings`)
  })
})
