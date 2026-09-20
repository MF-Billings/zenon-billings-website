import { expect, test } from '@playwright/test'
import { colourDistance, samplePixel } from './samplePixel'

// Grain shifts a paper pixel by a few units per channel; the wash at its
// specified opacity darkens all three by roughly fifteen. Halfway between.
const WASH_TINT_THRESHOLD = 20

// The design has the hero wash bleed in from the top right and past the
// container edge, onto the page margin. On a desktop viewport the container
// is narrower than the viewport, so that margin is where the bleed shows: a
// wash that stops flush with the container reads as a hard vertical cut.
test('the hero wash bleeds past the container edge on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)

  const hero = (await page.locator('.hero').boundingBox())!
  const marginX = hero.x + hero.width + 20

  const paper = await samplePixel(page, marginX, hero.y + hero.height + 40)

  const heroBand = [0.2, 0.35, 0.5, 0.65, 0.8].map((fraction) => hero.y + hero.height * fraction)
  const marginSamples = await Promise.all(heroBand.map((y) => samplePixel(page, marginX, y)))
  const strongestTint = Math.max(...marginSamples.map((sample) => colourDistance(sample, paper)))

  expect(strongestTint).toBeGreaterThan(WASH_TINT_THRESHOLD)
})
