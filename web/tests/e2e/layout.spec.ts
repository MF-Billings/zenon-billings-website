import { readdirSync } from 'node:fs'
import { test, expect } from '@playwright/test'

// Artwork pages carry a bloom at negative offsets, so at least one belongs in
// this guard. The slug comes from Sanity and changes with the content, so it is
// read from the build rather than hardcoded.
const firstArtworkPath = () => {
  const slugs = readdirSync('out/artwork', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  return slugs.length > 0 ? [`/artwork/${slugs[0]}/`] : []
}

// Blooms deliberately bleed past their containers and cards are rotated. Both
// are exactly what produces an accidental horizontal scrollbar, and neither is
// visible in a jsdom unit test.
const PAGES = ['/', '/gallery/', '/about/', ...firstArtworkPath()]

const VIEWPORTS = [
  { name: 'mobile', width: 320, height: 640 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
]

for (const path of PAGES) {
  for (const viewport of VIEWPORTS) {
    test(`${path} does not scroll horizontally on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(path)

      // next/font swaps in two variable fonts after first paint; measuring before
      // that reflow can pass on a page that overflows once the real fonts land.
      await page.evaluate(() => document.fonts.ready)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )

      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}

// The open menu is a panel hung from the right edge of the header. Anchored
// there, a panel wider than the space beside it would be the one thing on a
// phone that produces a horizontal scrollbar.
test('the open menu does not scroll horizontally on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/gallery/')
  await page.evaluate(() => document.fonts.ready)
  await page.getByRole('button', { name: /menu/i }).click()
  await expect(page.locator('.site-header__links')).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )

  expect(overflow).toBeLessThanOrEqual(0)
})

// Every section page opens with its name as a heading. Moving between the
// sections should never make that heading jump, so it sits the same distance
// below the header rule on each of them.
const SECTION_PAGES = ['/gallery/', '/about/']

test('section headings sit the same distance below the header rule', async ({ page }) => {
  const offsets: number[] = []

  for (const path of SECTION_PAGES) {
    await page.goto(path)
    await page.evaluate(() => document.fonts.ready)

    const rule = await page.locator('.site-header__rule').boundingBox()
    const heading = await page.getByRole('heading', { level: 1 }).boundingBox()

    offsets.push(Math.round(heading!.y - (rule!.y + rule!.height)))
  }

  expect(new Set(offsets).size).toBe(1)
})
