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
const PAGES = ['/', '/gallery/', '/about/', '/contact/', ...firstArtworkPath()]

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
