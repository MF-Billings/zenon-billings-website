import { expect, test, type Page } from '@playwright/test'
import { BRUSHSTROKE_NARROW_BREAKPOINT_EM } from '../../lib/brushstroke/brushstrokeWideBreakpoint'
import {
  contrastRatio,
  LEGIBILITY_CHECKS,
  minContrastUnder,
  PAPER,
  settleBrushstrokes,
} from './brushstrokeLegibility'
import { NARROW, VIEWPORTS, WIDE } from './homeViewports'

type Box = { x: number; y: number; width: number; height: number }

const open = async (page: Page) => {
  await page.goto('/')
  await settleBrushstrokes(page)
}

// A knob on .hero, in px. Knobs are written in rem, px or vw; anything else
// is a test bug, not a style bug, so it throws.
const knobPx = async (page: Page, name: string) =>
  page.evaluate((property) => {
    const raw = getComputedStyle(document.querySelector('.hero')!).getPropertyValue(property).trim()
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const match = raw.match(/^(-?[\d.]+)(rem|px|vw)$/)
    if (!match) throw new Error(`${property} is "${raw}", expected <n>rem, <n>px or <n>vw`)
    const value = Number(match[1])
    if (match[2] === 'rem') return value * rootPx
    if (match[2] === 'vw') return (value / 100) * document.documentElement.clientWidth
    return value
  }, name)

const box = async (page: Page, selector: string): Promise<Box> =>
  (await page.locator(selector).first().boundingBox())!

const clientWidth = (page: Page) => page.evaluate(() => document.documentElement.clientWidth)

// The layer clips its own bleed and spans exactly the viewport, so the
// document never scrolls sideways, whatever the container is doing.
const expectNoSidewaysScroll = async (page: Page) => {
  const width = await clientWidth(page)
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)

  for (const layer of await page.locator('.brushstroke-layer').all()) {
    const layerBox = (await layer.boundingBox())!
    expect(Math.abs(layerBox.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(layerBox.width - width)).toBeLessThanOrEqual(1)
  }
}

// Words of the name and the tagline that a tight cap would otherwise split:
// each word must sit on one line box.
const splitWords = (page: Page, selector: string) =>
  page.evaluate((selector) => {
    const split: string[] = []
    const walker = document.createTreeWalker(
      document.querySelector(selector)!,
      NodeFilter.SHOW_TEXT,
    )
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? ''
      for (const match of text.matchAll(/\S+/g)) {
        const range = document.createRange()
        range.setStart(node, match.index)
        range.setEnd(node, match.index + match[0].length)
        const tops = new Set(Array.from(range.getClientRects()).map((r) => Math.round(r.top)))
        if (tops.size > 1) split.push(match[0])
      }
    }
    return split
  }, selector)

// Text bends nothing: when ink sits over pigment, the pigment or the line
// length gives way. The checked elements and their floors are shared with
// the on-demand measure spec (brushstrokeMeasure.spec.ts), which reports the
// numbers this test only gates on.
const expectLegible = async (page: Page, label: string) => {
  for (const check of LEGIBILITY_CHECKS) {
    if (check.whenVisible && !(await page.locator(check.whenVisible).isVisible())) continue
    const results = await minContrastUnder(page, check.selector)
    for (const result of results) {
      expect(result.pixels, `${check.selector} "${result.text}" measured nothing`).toBeGreaterThan(
        0,
      )
      expect(
        result.minContrast,
        `${check.selector} "${result.text}" at ${label}`,
      ).toBeGreaterThanOrEqual(check.floor)
    }
  }

  expect(await splitWords(page, '.hero__wordmark'), `name words split at ${label}`).toEqual([])
  if (await page.locator('.hero__tagline').count()) {
    expect(await splitWords(page, '.hero__tagline'), `tagline words split at ${label}`).toEqual([])
  }
}

for (const viewport of VIEWPORTS) {
  test.describe(`home brushstrokes at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    test('hang from the header rule, in the screen corner, without widening the page', async ({
      page,
    }) => {
      await open(page)

      // Narrower than the step there is no room beside the name for a tree.
      if (viewport.width < NARROW) {
        await expect(page.locator('.hero__tree')).toBeHidden()
        await expectNoSidewaysScroll(page)
        return
      }

      const rule = await box(page, '.site-header__rule')
      const tree = await box(page, '.hero__tree')
      const width = await clientWidth(page)

      // Anchored to the rule by the knob, never to the hero's height.
      const top = await knobPx(page, '--brushstroke-tree-top')
      expect(Math.abs(tree.y - (rule.y + rule.height + top))).toBeLessThanOrEqual(1)

      // The layer's column has the page's content-column geometry.
      const column = await box(page, '.brushstroke-layer__column')
      const main = await box(page, 'main')
      expect(Math.abs(column.x - main.x)).toBeLessThanOrEqual(1)
      expect(Math.abs(column.width - main.width)).toBeLessThanOrEqual(1)

      // In the corner: the tree runs at most the bleed past the content column
      // and never past the screen edge. On a phone the bleed is the whole
      // screen, so the tree is flush with the edge whatever the column does.
      const bleed = await knobPx(page, '--brushstroke-tree-bleed')
      const expectedRight = Math.min(column.x + column.width + bleed, width)
      expect(Math.abs(tree.x + tree.width - expectedRight)).toBeLessThanOrEqual(1)

      await expectNoSidewaysScroll(page)
    })

    test('paint under the paper grain: no ancestor traps them', async ({ page }) => {
      await open(page)
      const offenders = await page.evaluate(() => {
        const found: string[] = []
        for (const brushstroke of document.querySelectorAll('.brushstroke')) {
          let node = brushstroke.parentElement
          while (node && node !== document.body) {
            const style = getComputedStyle(node)
            const isLayer =
              node.classList.contains('brushstroke-layer') ||
              node.classList.contains('brushstroke-layer__column')
            const problems = [
              !isLayer && style.position !== 'static' && 'position',
              style.zIndex !== 'auto' && 'z-index',
              style.transform !== 'none' && 'transform',
              style.translate !== 'none' && 'translate',
              style.rotate !== 'none' && 'rotate',
              style.scale !== 'none' && 'scale',
              style.filter !== 'none' && 'filter',
              style.backdropFilter !== 'none' && 'backdrop-filter',
              style.opacity !== '1' && 'opacity',
              style.isolation !== 'auto' && 'isolation',
              style.mixBlendMode !== 'normal' && 'mix-blend-mode',
              style.contain !== 'none' && 'contain',
              style.containerType !== 'normal' && 'container-type',
              style.contentVisibility !== 'visible' && 'content-visibility',
              style.willChange !== 'auto' && 'will-change',
              style.clipPath !== 'none' && 'clip-path',
              style.maskImage !== 'none' && 'mask-image',
              style.perspective !== 'none' && 'perspective',
              style.viewTransitionName !== 'none' && 'view-transition-name',
            ].filter(Boolean)
            if (problems.length) {
              found.push(`${node.tagName}.${node.className}: ${problems.join(', ')}`)
            }
            node = node.parentElement
          }
        }
        return found
      })
      expect(offenders).toEqual([])
    })

    test('show the phone tree below the wide breakpoint and the pines and water from it', async ({
      page,
    }) => {
      const requests: string[] = []
      page.on('request', (request) => requests.push(request.url()))
      await open(page)

      const tree = page.locator('.hero__tree')
      const water = page.locator('.hero__water')
      const currentSrc = await tree.evaluate((img: HTMLImageElement) => img.currentSrc)

      if (viewport.width < NARROW) {
        await expect(tree).toBeHidden()
        await expect(water).toBeHidden()
        expect(requests.some((url) => url.includes('water.webp'))).toBe(false)
      } else if (viewport.width < WIDE) {
        expect(currentSrc.endsWith('/brushstrokes/tree.webp')).toBe(true)
        await expect(water).toBeHidden()
        expect(requests.some((url) => url.includes('water.webp'))).toBe(false)
      } else {
        expect(currentSrc.endsWith('/brushstrokes/trees.webp')).toBe(true)
        await expect(water).toBeVisible()

        // Hangs from the tagline, and from the wordmark once the tagline is
        // gone: Sanity's tagline is optional, so the fallback is exercised by
        // removing it in the page.
        const top = await knobPx(page, '--brushstroke-water-top')
        const anchor = await box(page, '.hero__tagline')
        const waterBox = await box(page, '.hero__water')
        expect(Math.abs(waterBox.y - (anchor.y + anchor.height + top))).toBeLessThanOrEqual(1)

        await page.evaluate(() => document.querySelector('.hero__tagline')?.remove())
        const wordmark = await box(page, '.hero__wordmark')
        const waterWithoutTagline = await box(page, '.hero__water')
        expect(
          Math.abs(waterWithoutTagline.y - (wordmark.y + wordmark.height + top)),
        ).toBeLessThanOrEqual(1)

        // Its width is a share of the content column, not of the screen and
        // not capped by Pico's img { max-width: 100% }.
        const widthKnob = await page.evaluate(() =>
          getComputedStyle(document.querySelector('.hero')!)
            .getPropertyValue('--brushstroke-water-width')
            .trim(),
        )
        const share = Number(widthKnob.match(/^([\d.]+)%$/)![1]) / 100
        const column = await box(page, '.brushstroke-layer__column')
        expect(Math.abs(waterBox.width - share * column.width)).toBeLessThanOrEqual(2)
      }

      // Each rendered file is the one the markup describes, at the size it
      // claims. Inside a <picture> the claim is on whichever <source> matched.
      const mismatches = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLImageElement>('img.brushstroke'))
          .filter((img) => getComputedStyle(img).display !== 'none')
          .map((img) => {
            const sources = Array.from(img.parentElement?.querySelectorAll('source') ?? [])
            const claim = sources.find((source) => matchMedia(source.media).matches) ?? img
            return {
              img,
              width: Number(claim.getAttribute('width')),
              height: Number(claim.getAttribute('height')),
            }
          })
          .filter(
            ({ img, width, height }) =>
              !img.complete || img.naturalWidth !== width || img.naturalHeight !== height,
          )
          .map(({ img }) => `${img.currentSrc}: ${img.naturalWidth}x${img.naturalHeight}`),
      )
      expect(mismatches).toEqual([])
    })

    test('leave every piece of text over them legible', async ({ page }) => {
      await open(page)

      // The helper's own sanity check: muted ink on bare paper is the README's 4.61:1.
      expect(contrastRatio([0x6e, 0x6a, 0x63], PAPER)).toBeCloseTo(4.61, 1)

      await expectLegible(page, `${viewport.width}px`)
    })
  })
}

// A reader who has set a large default font gets a bigger name and tagline
// in the same width; the tree has to give way to them just as it does on a
// zoomed phone. Chromium only, through the devtools protocol.
for (const fontSize of [20, 24]) {
  test.describe(`home brushstrokes on a phone with a ${fontSize}px default font`, () => {
    test.use({ viewport: { width: 375, height: 812 } })

    test('leave the name and the tagline legible and whole', async ({ page }) => {
      const session = await page.context().newCDPSession(page)
      await session.send('Page.setFontSizes', { fontSizes: { standard: fontSize } })
      await open(page)
      await expectLegible(page, `375px at ${fontSize}px`)
      await expectNoSidewaysScroll(page)

      // The narrow step is in em, so a large default font moves it past this
      // phone's width and the tree gives way.
      const tree = page.locator('.hero__tree')
      if (375 < BRUSHSTROKE_NARROW_BREAKPOINT_EM * fontSize) await expect(tree).toBeHidden()
      else await expect(tree).toBeVisible()
    })
  })
}

// Headless Chromium hides scrollbars, so every test above runs with
// clientWidth equal to 100vw and would stay green if the layer were sized
// by 100vw. This one keeps a classic 15px scrollbar and proves it has one.
test.describe('home brushstrokes beside a classic scrollbar', () => {
  for (const width of [375, 1280, 1878]) {
    test(`fit the viewport at ${width}px`, async ({ playwright }) => {
      // Launch options cannot change per test, so this one gets its own browser.
      const browser = await playwright.chromium.launch({
        ignoreDefaultArgs: ['--hide-scrollbars'],
      })
      const page = await browser.newPage({
        baseURL: test.info().project.use.baseURL,
        viewport: { width, height: 800 },
      })
      await open(page)
      const scrollbar = await page.evaluate(
        () => window.innerWidth - document.documentElement.clientWidth,
      )
      expect(scrollbar).toBeGreaterThan(0)
      await expectNoSidewaysScroll(page)
      await browser.close()
    })
  }
})

test('brushstrokes give way to a request for more contrast, like the grain', async ({ page }) => {
  await page.emulateMedia({ contrast: 'more' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  for (const brushstroke of await page.locator('.brushstroke').all()) {
    await expect(brushstroke).toBeHidden()
  }
})
