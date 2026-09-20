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

// The nav markers are list bullets, which have no DOM box of their own. When
// the nav wraps below the wordmark on a phone the list starts flush with the
// container's edge, and a marker drawn outside the item is pushed off screen.
test('the first nav marker stays inside the viewport on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/gallery/')
  await page.evaluate(() => document.fonts.ready)

  const item = page.locator('.site-header__links li').first()
  const itemBox = await item.boundingBox()
  const linkBox = await item.getByRole('link').boundingBox()

  expect(itemBox!.x).toBeGreaterThanOrEqual(0)
  // The marker occupies width inside the item; if the link starts at the item's
  // own left edge, the marker has been drawn outside it.
  expect(linkBox!.x).toBeGreaterThan(itemBox!.x)
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
