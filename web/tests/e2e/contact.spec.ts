import { expect, test } from '@playwright/test'

test.describe('contact form', () => {
  test('validates before sending anything', async ({ page }) => {
    let requests = 0
    await page.route('https://api.web3forms.com/**', async (route) => {
      requests += 1
      await route.fulfill({ json: { success: true } })
    })

    await page.goto('/contact/')
    await page.getByRole('button', { name: /send/i }).click()

    await expect(page.locator('form [role="alert"]')).toContainText(/please enter your name/i)
    expect(requests).toBe(0)
  })

  test('confirms a successful submission', async ({ page }) => {
    await page.route('https://api.web3forms.com/**', (route) =>
      route.fulfill({ json: { success: true } }),
    )

    await page.goto('/contact/')
    await page.getByLabel('Name').fill('Ada')
    await page.getByLabel('Email').fill('ada@example.com')
    await page.getByLabel('Message').fill('I love the river piece.')
    await page.getByRole('button', { name: /send/i }).click()

    await expect(page.getByRole('status')).toContainText(/thank you/i)
  })

  test('surfaces a service failure to the visitor', async ({ page }) => {
    await page.route('https://api.web3forms.com/**', (route) =>
      route.fulfill({ status: 400, json: { success: false, message: 'Invalid access key' } }),
    )

    await page.goto('/contact/')
    await page.getByLabel('Name').fill('Ada')
    await page.getByLabel('Email').fill('ada@example.com')
    await page.getByLabel('Message').fill('Hello')
    await page.getByRole('button', { name: /send/i }).click()

    await expect(page.locator('form [role="alert"]')).toContainText('Invalid access key')
  })

  test('exposes no address unless a public alias is configured', async ({ page }) => {
    // ContactAliasLink is unit-tested in both states. What matters end to end is that
    // an unset alias publishes no address at all, rather than falling back to one.
    await page.goto('/contact/')

    const alias = process.env.PUBLIC_CONTACT_ALIAS
    if (alias) {
      await expect(page.locator(`a[href="mailto:${alias}"]`)).toBeVisible()
    } else {
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0)
    }
  })
})
