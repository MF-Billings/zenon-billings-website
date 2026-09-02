import { test, expect } from '@playwright/test'

// Blooms deliberately bleed past their containers and cards are rotated. Both
// are exactly what produces an accidental horizontal scrollbar, and neither is
// visible in a jsdom unit test.
const PAGES = ['/', '/gallery/', '/about/', '/contact/']

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

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )

      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}
