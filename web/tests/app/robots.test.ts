import robots from '@/app/robots'

describe('robots', () => {
  it('allows every crawler over the whole site', () => {
    expect(robots().rules).toEqual({ userAgent: '*', allow: '/' })
  })

  it('points crawlers at the sitemap', () => {
    expect(robots().sitemap).toBe('http://localhost:3000/sitemap.xml')
  })

  it('uses an absolute sitemap url, which the spec requires', () => {
    expect(robots().sitemap).toMatch(/^https?:\/\//)
  })
})
