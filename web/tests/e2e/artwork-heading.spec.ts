import { readdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// The slug comes from Sanity and changes with the content, so it is read from
// the build rather than hardcoded.
const firstArtworkPath = () => {
  const [slug] = readdirSync('out/artwork', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  return `/artwork/${slug}/`
}

// The global h1 scale is sized for section openers. Beside a painting the
// artwork's title reads as a placard, so it is set smaller on desktop.
test('the artwork title is set at 2.9rem on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto(firstArtworkPath())
  await page.evaluate(() => document.fonts.ready)

  // Pico scales the root font size up at desktop widths, so the expectation is
  // taken in rem against the live root rather than assumed from 16px.
  const headingInRem = await page.getByRole('heading', { level: 1 }).evaluate((heading) => {
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
    return parseFloat(getComputedStyle(heading).fontSize) / rootPx
  })

  expect(headingInRem).toBeCloseTo(2.9, 5)
})
