import { expect, test } from '@playwright/test'

test.describe('site', () => {
  test('navigates between every top-level section', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: /gallery/i }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Gallery' })).toBeVisible()

    await page.getByRole('link', { name: /about/i }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('About')

    await page.getByRole('link', { name: /contact/i }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Contact' })).toBeVisible()
  })

  test('renders the artist bio from the CMS', async ({ page }) => {
    await page.goto('/about/')
    await expect(page.locator('main p').first()).not.toBeEmpty()
  })

  test('serves robots.txt pointing at the sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.ok()).toBeTruthy()
    expect(await response.text()).toContain('Sitemap:')
  })

  test('serves a sitemap listing the artwork pages', async ({ request }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.ok()).toBeTruthy()

    const xml = await response.text()
    expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThan(4)
    expect(xml).toContain('/artwork/')
  })
})
