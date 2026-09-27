import { expect, test } from '@playwright/test'

// The header's wordmark is pure CSS behaviour keyed on the page's own markup,
// so it can only be observed in a real browser with the stylesheet applied.
test.describe('header wordmark', () => {
  test('stands down on the home page, where the hero already carries the name', async ({
    page,
  }) => {
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    await expect(page.locator('.site-header__wordmark')).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/zenon billings/i)
  })

  test('keeps the nav links at the right edge once the wordmark is gone', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)

    const nav = await page.locator('.site-header__nav').boundingBox()
    const links = await page.locator('.site-header__links').boundingBox()

    expect(links!.x + links!.width).toBeCloseTo(nav!.x + nav!.width, 0)
  })

  test('shows the wordmark as plain text on every page without the hero', async ({ page }) => {
    for (const path of ['/gallery/', '/about/']) {
      await page.goto(path)
      const wordmark = page.locator('.site-header__wordmark')
      await expect(wordmark).toBeVisible()
      await expect(wordmark).toHaveText('Zenon Billings')
      await expect(page.getByRole('link', { name: 'Zenon Billings' })).toHaveCount(0)
      await expect(page.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    }
  })

  // The wordmark's line box sets the nav row's height. Taking it out of
  // layout on the home page let the row shrink, so the rule beneath the header
  // sat higher there than on every other page and visibly jumped between them.
  test('draws the header rule at the same height on every page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    const ruleTop = async (path: string) => {
      await page.goto(path)
      await page.evaluate(() => document.fonts.ready)
      return (await page.locator('.site-header__rule').boundingBox())!.y
    }

    expect(await ruleTop('/')).toBeCloseTo(await ruleTop('/gallery/'), 0)
  })
})

// From this width on, the wordmark and the four links share one row: Pico's
// container grows to 700px here, and the row needs about 645px. Any narrower
// and the container is capped at 510px, so the list folds behind a menu toggle
// instead of wrapping under the wordmark.
const MENU_BREAKPOINT = 768

// The widest phone the site is checked against (an iPhone Pro Max viewport).
const LARGE_PHONE = { width: 440, height: 956 }
const SMALL_PHONE = { width: 375, height: 667 }

test.describe('header menu on a narrow screen', () => {
  test('hides the links behind a toggle until it is pressed', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)

    const toggle = page.getByRole('button', { name: /menu/i })
    const links = page.locator('.site-header__links')

    await expect(toggle).toBeVisible()
    await expect(links).toBeHidden()

    await toggle.click()
    await expect(links).toBeVisible()
    await expect(page.getByRole('link', { name: 'Gallery' })).toBeVisible()
  })

  test('keeps the wordmark and every link on one row as soon as they fit, with no toggle', async ({
    page,
  }) => {
    await page.setViewportSize({ width: MENU_BREAKPOINT, height: 1024 })
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)

    await expect(page.getByRole('button', { name: /menu/i })).toBeHidden()
    await expect(page.locator('.site-header__links')).toBeVisible()

    const rowTops = await page
      .locator('.site-header__links li')
      .evaluateAll((items) => new Set(items.map((item) => item.getBoundingClientRect().top)).size)
    expect(rowTops).toBe(1)

    // The row sits beside the wordmark, not beneath it. The two align on their
    // baseline at different sizes, so compare the boxes for overlap, not tops.
    const wordmark = (await page.locator('.site-header__wordmark').boundingBox())!
    const links = (await page.locator('.site-header__links').boundingBox())!
    expect(links.y).toBeLessThan(wordmark.y + wordmark.height)
  })

  test('shows the toggle at the widest width where the links would wrap under the wordmark', async ({
    page,
  }) => {
    await page.setViewportSize({ width: MENU_BREAKPOINT - 1, height: 1024 })
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)

    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()
    await expect(page.locator('.site-header__links')).toBeHidden()
  })

  // On the home page the wordmark is hidden but keeps its line box. If the
  // links wrapped beneath it on a wide phone, that line box became a blank
  // band above the links; a large phone must fold the links like a small one.
  test('folds the links behind the toggle on a large phone, so the header is one row', async ({
    page,
  }) => {
    const ruleTop = async (viewport: { width: number; height: number }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      return (await page.locator('.site-header__rule').boundingBox())!.y
    }

    const smallPhoneRuleTop = await ruleTop(SMALL_PHONE)
    const largePhoneRuleTop = await ruleTop(LARGE_PHONE)

    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()
    expect(largePhoneRuleTop).toBeCloseTo(smallPhoneRuleTop, 0)
  })

  test('lays the open menu over the page instead of pushing it down', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)

    const rule = page.locator('.site-header__rule')
    const heading = page.getByRole('heading', { level: 1 })
    const ruleTopBefore = (await rule.boundingBox())!.y
    const headingTopBefore = (await heading.boundingBox())!.y

    await page.getByRole('button', { name: /menu/i }).click()
    await expect(page.locator('.site-header__links')).toBeVisible()

    expect((await rule.boundingBox())!.y).toBe(ruleTopBefore)
    expect((await heading.boundingBox())!.y).toBe(headingTopBefore)
  })

  test('hangs the open menu from the toggle, flush with its right edge', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)

    const toggle = page.getByRole('button', { name: /menu/i })
    await toggle.click()

    const toggleBox = (await toggle.boundingBox())!
    const panel = (await page.locator('.site-header__links').boundingBox())!

    expect(panel.x + panel.width).toBeCloseTo(toggleBox.x + toggleBox.width, 0)
    // The sheet meets the toggle's bottom edge: the toggle is its tab.
    expect(panel.y).toBeLessThanOrEqual(toggleBox.y + toggleBox.height)
    expect(panel.y).toBeGreaterThan(toggleBox.y)
    expect(panel.x).toBeGreaterThanOrEqual(0)
    expect(panel.x + panel.width).toBeLessThanOrEqual(320)
  })

  // Pressed, the toggle takes on the sheet's own surface so the two read as
  // one shape: a tab on the corner of the sheet it opened. Neither has an
  // outline; the sheet is a piece of paper lifted off the page, not a box.
  test('gives the pressed toggle the same surface as the open sheet, with no outline on either', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)

    const toggle = page.getByRole('button', { name: /menu/i })
    const sheet = page.locator('.site-header__links')
    const surface = (locator: typeof toggle) =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element)
        return { background: style.backgroundColor, outline: style.borderTopWidth }
      })

    const restingToggle = await surface(toggle)
    await toggle.click()
    const pressedToggle = await surface(toggle)
    const openSheet = await surface(sheet)

    expect(pressedToggle.background).toBe(openSheet.background)
    expect(restingToggle.background).not.toBe(openSheet.background)
    expect(pressedToggle.outline).toBe('0px')
    expect(openSheet.outline).toBe('0px')
  })

  test('lifts the open sheet off the page with a shadow and tears its bottom edge', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)
    await page.getByRole('button', { name: /menu/i }).click()

    const sheet = page.locator('.site-header__links')
    const torn = await sheet.evaluate((element) => getComputedStyle(element).maskImage)
    expect(torn).not.toBe('none')

    // The shadow cannot sit on the masked element, where the mask would clip
    // it, so it is cast by whichever ancestor carries the sheet.
    const lifted = await sheet.evaluate((element) => {
      for (let node = element.parentElement; node; node = node.parentElement) {
        if (getComputedStyle(node).boxShadow !== 'none') return true
      }
      return false
    })
    expect(lifted).toBe(true)
  })

  test('keeps the rows unruled inside the open sheet', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/gallery/')
    await page.getByRole('button', { name: /menu/i }).click()

    await expect(page.locator('.site-header__links .ink-rule')).toHaveCount(0)
    const rowEdge = await page
      .locator('.site-header__links li')
      .nth(1)
      .evaluate((row) => getComputedStyle(row).borderTopWidth)
    expect(rowEdge).toBe('0px')
  })

  // The sheet drops in over a few frames rather than snapping into place; a
  // visitor who has asked for reduced motion gets it in one frame instead.
  test('drops the sheet in with a short motion unless motion is reduced', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    const sheetMotion = () =>
      page.locator('.site-header__sheet').evaluate((sheet) => {
        const style = getComputedStyle(sheet)
        return { name: style.animationName, duration: style.animationDuration }
      })

    await page.goto('/gallery/')
    await page.getByRole('button', { name: /menu/i }).click()
    const motion = await sheetMotion()
    expect(motion.name).not.toBe('none')
    expect(parseFloat(motion.duration)).toBeGreaterThan(0)
    expect(parseFloat(motion.duration)).toBeLessThanOrEqual(0.25)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/gallery/')
    await page.getByRole('button', { name: /menu/i }).click()
    expect((await sheetMotion()).name).toBe('none')
  })

  test('sets the links in the display face inside the open sheet, not in the row', async ({
    page,
  }) => {
    const link = page.getByRole('link', { name: 'Gallery' })
    const widthAxis = () =>
      link.evaluate((element) => getComputedStyle(element).fontVariationSettings)

    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/gallery/')
    await page.evaluate(() => document.fonts.ready)
    expect(await widthAxis()).not.toContain('125')

    await page.setViewportSize({ width: 320, height: 640 })
    await page.getByRole('button', { name: /menu/i }).click()
    expect(await widthAxis()).toContain('125')
  })

  test('never shows the toggle on a desktop screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/gallery/')

    await expect(page.getByRole('button', { name: /menu/i })).toBeHidden()
    await expect(page.locator('.site-header__links')).toBeVisible()
  })
})
