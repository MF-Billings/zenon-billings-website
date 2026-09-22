import { expect, test, type Page } from '@playwright/test'

const trigger = (page: Page) => page.getByRole('link', { name: /view .* full size/i })
const lightbox = (page: Page) => page.locator('.pswp')
const counter = (page: Page) => page.locator('.pswp__counter')
const nextArrow = (page: Page) => page.locator('.pswp__button--arrow--next')
const closeButton = (page: Page) => page.locator('.pswp__button--close')

// PhotoSwipe ignores close() while its opening animation runs, and the one DOM
// change that marks the animation's end is the neighbouring slide holders being
// shown. Waiting for that keeps every later click honest.
const openLightbox = async (page: Page) => {
  await trigger(page).click()
  await expect(lightbox(page)).toBeVisible()
  await expect(page.locator('.pswp__item').nth(2)).toBeVisible()
}

const openFromGallery = async (page: Page, cardIndex: number) => {
  await page.goto('/gallery/')
  const titles = await page.locator('.artwork-card h3').allInnerTexts()
  await page.locator('.artwork-card a').nth(cardIndex).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles[cardIndex])
  return titles
}

test.describe('artwork lightbox', () => {
  test('opens PhotoSwipe on the painting when it is clicked', async ({ page }) => {
    await openFromGallery(page, 0)

    await openLightbox(page)

    await expect(page.locator('.pswp__img').first()).toHaveAttribute('src', /cdn\.sanity\.io/)
  })

  test('walks the collection in gallery order from the current painting', async ({ page }) => {
    const titles = await openFromGallery(page, 0)
    test.skip(titles.length < 2, 'need at least two artworks to navigate between')

    await openLightbox(page)
    await expect(counter(page)).toHaveText(`1 / ${titles.length}`)

    await nextArrow(page).click()
    await expect(counter(page)).toHaveText(`2 / ${titles.length}`)
  })

  test('walks only the tag-filtered set chosen in the gallery', async ({ page }) => {
    await page.goto('/gallery/')
    const total = await page.locator('.artwork-card').count()
    await page.getByRole('checkbox').first().check()
    await expect(page).toHaveURL(/[?&]tags=/)
    const filtered = await page.locator('.artwork-card').count()
    test.skip(filtered === total, 'first tag does not narrow this dataset')

    await page.locator('.artwork-card a').first().click()
    await expect(page).toHaveURL(/[?&]tags=/)
    await openLightbox(page)

    await expect(counter(page)).toHaveText(`1 / ${filtered}`)
  })

  test('lands on the painting the visitor closed on', async ({ page }) => {
    const titles = await openFromGallery(page, 0)
    test.skip(titles.length < 2, 'need at least two artworks to navigate between')

    await openLightbox(page)
    await nextArrow(page).click()
    await expect(counter(page)).toHaveText(`2 / ${titles.length}`)
    await closeButton(page).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles[1])
  })

  test('stays put when closed on the painting it opened on', async ({ page }) => {
    const titles = await openFromGallery(page, 0)

    await openLightbox(page)
    await closeButton(page).click()

    await expect(lightbox(page)).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles[0])
  })

  test('never shows a slide larger than its own pixels, however big the screen', async ({
    browser,
  }) => {
    // PhotoSwipe caps its fit zoom at 1:1, which is what keeps a capped weak scan
    // (see displayMaxWidth) from being stretched. A huge viewport forces the case
    // so a future option change cannot quietly undo it.
    const context = await browser.newContext({ viewport: { width: 5000, height: 5000 } })
    const page = await context.newPage()
    await openFromGallery(page, 0)
    await openLightbox(page)

    const slide = page.locator('.pswp__img:not(.pswp__img--placeholder)').first()
    await expect(slide).toBeVisible()
    await slide.evaluate((img: HTMLImageElement) => img.decode())
    const rendered = (await slide.boundingBox())!.width
    const natural = await slide.evaluate((img: HTMLImageElement) => img.naturalWidth)

    expect(natural).toBeGreaterThan(0)
    expect(rendered).toBeLessThanOrEqual(natural + 1)
    await context.close()
  })

  test('keeps a narrow painting centred on its sheet', async ({ page }) => {
    // The trigger wraps the picture; it must not change where the picture sits.
    await page.goto('/gallery/')
    const count = await page.locator('.artwork-card').count()

    let found = false
    for (let index = 0; index < count && !found; index += 1) {
      await page.goto('/gallery/')
      await page.locator('.artwork-card a').nth(index).click()
      const image = page.locator('.artwork-detail__image')
      await expect(image).toBeVisible()
      await image.evaluate((img: HTMLImageElement) => img.decode())
      const imageBox = (await image.boundingBox())!
      const mountBox = (await page.locator('.artwork-detail__mount').boundingBox())!
      if (imageBox.width < mountBox.width - 100) {
        found = true
        const imageMidX = imageBox.x + imageBox.width / 2
        const mountMidX = mountBox.x + mountBox.width / 2
        expect(Math.abs(imageMidX - mountMidX)).toBeLessThan(1)
      }
    }
    test.skip(!found, 'no painting in this dataset is narrower than its sheet')
  })

  test('without JavaScript the painting links straight to its full-size image', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/gallery/')
    await page.locator('.artwork-card a').first().click()

    await expect(trigger(page)).toHaveAttribute('href', /cdn\.sanity\.io/)
    await context.close()
  })
})
