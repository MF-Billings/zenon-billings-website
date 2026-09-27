import { test, type Page } from '@playwright/test'
import { LEGIBILITY_CHECKS, minContrastUnder, settleBrushstrokes } from './brushstrokeLegibility'
import { VIEWPORTS } from './homeViewports'

// On demand only. The home e2e says pass or fail; this prints the numbers.
//
//   BRUSHSTROKE_MEASURE=1 npx playwright test tests/e2e/brushstrokeMeasure.spec.ts
//     the minimum contrast of every checked element at every width
//   BRUSHSTROKE_SCAN=--brushstroke-tree-crown npx playwright test tests/e2e/brushstrokeMeasure.spec.ts
//     the largest value of a 0..1 knob on .hero that keeps every check at its floor,
//     found by bisection at every width, and the width that binds it
//   BRUSHSTROKE_WIDTHS=768-1920:16 (a range with a step) or 1088,1200 (a list)
//     adds widths to the suite's own; the suite samples, a knob's ceiling can sit between
//
// Reads the same checks, floors and settle as the home e2e, so it measures
// what the suite judges. See docs/hero-brushstrokes.md.
const MEASURE = process.env.BRUSHSTROKE_MEASURE
const SCAN = process.env.BRUSHSTROKE_SCAN

const extraWidths = (spec: string | undefined) => {
  if (!spec) return []
  const range = spec.match(/^(\d+)-(\d+):(\d+)$/)
  if (range) {
    const [, from, to, step] = range.map(Number)
    return Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step)
  }
  return spec.split(',').map(Number).filter(Boolean)
}

const widths = [
  ...new Set([...VIEWPORTS.map((v) => v.width), ...extraWidths(process.env.BRUSHSTROKE_WIDTHS)]),
].sort((a, b) => a - b)

test.skip(!MEASURE && !SCAN, 'set BRUSHSTROKE_MEASURE=1 or BRUSHSTROKE_SCAN=<knob> to run')

const openAt = async (page: Page, width: number) => {
  await page.setViewportSize({ width, height: 900 })
  await page.goto('/')
  await settleBrushstrokes(page)
}

// Worst ratio of measured contrast to floor across every visible check: 1 or
// more means every check passes.
type Worst = { margin: number; selector: string; text: string; contrast: number }
const worstMargin = async (page: Page): Promise<Worst> => {
  let worst: Worst = { margin: Infinity, selector: '', text: '', contrast: Infinity }
  for (const check of LEGIBILITY_CHECKS) {
    if (check.whenVisible && !(await page.locator(check.whenVisible).isVisible())) continue
    for (const result of await minContrastUnder(page, check.selector)) {
      const margin = result.minContrast / check.floor
      if (margin < worst.margin) {
        worst = {
          margin,
          selector: check.selector,
          text: result.text,
          contrast: result.minContrast,
        }
      }
    }
  }
  return worst
}

test('measure the minimum contrast of every checked element at every width', async ({ page }) => {
  test.skip(!MEASURE, 'BRUSHSTROKE_MEASURE not set')
  test.setTimeout(20 * 60_000)
  const lowest = new Map<string, { width: number; contrast: number; text: string }>()
  for (const width of widths) {
    await openAt(page, width)
    for (const check of LEGIBILITY_CHECKS) {
      if (check.whenVisible && !(await page.locator(check.whenVisible).isVisible())) continue
      for (const result of await minContrastUnder(page, check.selector)) {
        console.log(
          `MEASURE ${width} ${check.selector} "${result.text}" ${result.minContrast.toFixed(2)} (floor ${check.floor})`,
        )
        const key = `${check.selector} "${result.text}"`
        const seen = lowest.get(key)
        if (!seen || result.minContrast < seen.contrast) {
          lowest.set(key, { width, contrast: result.minContrast, text: result.text })
        }
      }
    }
  }
  for (const [key, low] of lowest) {
    console.log(`LOWEST ${key} ${low.contrast.toFixed(2)} at ${low.width}px`)
  }
})

test('scan a 0..1 knob on .hero for the largest value that keeps every check legible', async ({
  page,
}) => {
  test.skip(!SCAN, 'BRUSHSTROKE_SCAN not set')
  test.setTimeout(30 * 60_000)
  const knob = SCAN!
  let ceiling = { value: 1, width: 0, bound: '' }
  for (const width of widths) {
    await openAt(page, width)
    const marginAt = async (value: number) => {
      await page.evaluate(
        ([name, v]) =>
          (document.querySelector<HTMLElement>('.hero')!.style as CSSStyleDeclaration).setProperty(
            name,
            String(v),
          ),
        [knob, value] as const,
      )
      return worstMargin(page)
    }
    let low = 0
    let high = 1
    let bound = await marginAt(1)
    if (bound.margin >= 1) {
      console.log(`SCAN ${knob} ${width} ceiling=1.000 (passes at full strength)`)
      continue
    }
    for (let i = 0; i < 12; i++) {
      const mid = (low + high) / 2
      const worst = await marginAt(mid)
      if (worst.margin >= 1) low = mid
      else {
        high = mid
        bound = worst
      }
    }
    console.log(
      `SCAN ${knob} ${width} ceiling=${low.toFixed(3)} bound by ${bound.selector} "${bound.text}" (${bound.contrast.toFixed(2)} just above)`,
    )
    if (low < ceiling.value)
      ceiling = { value: low, width, bound: `${bound.selector} "${bound.text}"` }
  }
  console.log(
    `CEILING ${knob} ${ceiling.value.toFixed(3)} bound at ${ceiling.width}px by ${ceiling.bound}`,
  )
})
