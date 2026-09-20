import { vi } from 'vitest'

vi.mock('@/lib/sanity/client', () => ({
  client: { fetch: vi.fn().mockResolvedValue([{ slug: 'river' }, { slug: 'portrait' }]) },
}))

const { default: sitemap } = await import('@/app/sitemap')

describe('sitemap', () => {
  it('lists every static page', async () => {
    const urls = (await sitemap()).map((entry) => entry.url)

    expect(urls).toEqual(
      expect.arrayContaining([
        'http://localhost:3000',
        'http://localhost:3000/gallery',
        'http://localhost:3000/about',
      ]),
    )
  })

  it('lists no page for contact, which is a section of the home page', async () => {
    const urls = (await sitemap()).map((entry) => entry.url)
    expect(urls).not.toContain('http://localhost:3000/contact')
  })

  it('lists every artwork detail page', async () => {
    const urls = (await sitemap()).map((entry) => entry.url)

    expect(urls).toContain('http://localhost:3000/artwork/river')
    expect(urls).toContain('http://localhost:3000/artwork/portrait')
  })

  it('ranks the home page above the detail pages', async () => {
    const entries = await sitemap()
    const home = entries.find((entry) => entry.url === 'http://localhost:3000')
    const artwork = entries.find((entry) => entry.url.includes('/artwork/'))

    expect(home!.priority!).toBeGreaterThan(artwork!.priority!)
  })

  it('emits no duplicate urls', async () => {
    const urls = (await sitemap()).map((entry) => entry.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('gives every entry an absolute url', async () => {
    for (const entry of await sitemap()) {
      expect(entry.url).toMatch(/^https?:\/\//)
    }
  })
})
