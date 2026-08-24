import { buildSrcSet, urlFor } from '@/lib/sanity/imageUrl'

const imageSource = {
  _type: 'image' as const,
  asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' as const },
}

describe('urlFor', () => {
  it('builds a Sanity CDN url for the configured project and dataset', () => {
    const url = urlFor(imageSource).width(400).url()

    expect(url).toContain('cdn.sanity.io')
    expect(url).toContain('nlwxmhc1')
    expect(url).toContain('w=400')
  })
})

describe('buildSrcSet', () => {
  it('emits one candidate per width, each tagged with its pixel width', () => {
    const srcSet = buildSrcSet(imageSource, [400, 800])
    const candidates = srcSet.split(', ')

    expect(candidates).toHaveLength(2)
    expect(candidates[0]).toMatch(/w=400.* 400w$/)
    expect(candidates[1]).toMatch(/w=800.* 800w$/)
  })

  it('requests auto format so the CDN can serve WebP or AVIF', () => {
    expect(buildSrcSet(imageSource, [400])).toContain('auto=format')
  })
})
