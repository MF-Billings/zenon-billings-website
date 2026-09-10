import { buildSrcSet, imageUrl, urlFor } from '@/lib/sanity/imageUrl'

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

describe('imageUrl', () => {
  it('scales to the requested width and keeps the source proportions by default', () => {
    const url = imageUrl(imageSource, 400)

    expect(url).toContain('w=400')
    expect(url).not.toContain('h=')
    expect(url).toContain('fit=max')
  })

  it('crops to a fixed aspect ratio when one is given, so thumbnails share a shape', () => {
    const url = imageUrl(imageSource, 400, { aspectRatio: 4 / 3 })

    expect(url).toContain('w=400')
    expect(url).toContain('h=300')
    expect(url).toContain('fit=crop')
  })

  it('rounds the derived height to whole pixels', () => {
    expect(imageUrl(imageSource, 300, { aspectRatio: 16 / 9 })).toContain('h=169')
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

  it('crops every candidate to the same aspect ratio when one is given', () => {
    const candidates = buildSrcSet(imageSource, [300, 600], { aspectRatio: 1 }).split(', ')

    expect(candidates[0]).toMatch(/h=300.*fit=crop/)
    expect(candidates[1]).toMatch(/h=600.*fit=crop/)
  })
})
