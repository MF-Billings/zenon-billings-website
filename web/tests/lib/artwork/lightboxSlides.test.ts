import { lightboxSlides, type LightboxArtwork } from '@/lib/artwork/lightboxSlides'

const tag = (slug: string) => ({ name: slug, slug })
const image = (id: string) => ({
  _type: 'image' as const,
  asset: { _ref: `image-${id}-4000x3000-jpg`, _type: 'reference' as const },
})

const make = (slug: string, tagSlugs: string[], overrides: Partial<LightboxArtwork> = {}) =>
  ({
    slug,
    title: slug,
    tags: tagSlugs.map(tag),
    image: image(slug),
    imageWidth: 4000,
    imageHeight: 3000,
    altText: `${slug} alt`,
    displayMaxWidth: null,
    ...overrides,
  }) satisfies LightboxArtwork

const river = make('river', ['landscape'])
const portrait = make('portrait', ['portrait'])
const meadow = make('meadow', ['landscape'])
const collection = [river, portrait, meadow]

describe('lightboxSlides', () => {
  it('turns the whole collection into slides in order and starts at the current artwork', () => {
    const { slides, startIndex } = lightboxSlides(collection, 'portrait', [])
    expect(slides.map((slide) => slide.slug)).toEqual(['river', 'portrait', 'meadow'])
    expect(startIndex).toBe(1)
  })

  it('narrows to the tagged subset and re-indexes the start', () => {
    const { slides, startIndex } = lightboxSlides(collection, 'meadow', ['landscape'])
    expect(slides.map((slide) => slide.slug)).toEqual(['river', 'meadow'])
    expect(startIndex).toBe(1)
  })

  it('falls back to the whole collection when the current artwork is outside the tag set', () => {
    const { slides, startIndex } = lightboxSlides(collection, 'portrait', ['landscape'])
    expect(slides).toHaveLength(3)
    expect(startIndex).toBe(1)
  })

  it('sizes each slide at the native pixels and points src at the CDN', () => {
    const [slide] = lightboxSlides([river], 'river', []).slides
    expect(slide.width).toBe(4000)
    expect(slide.height).toBe(3000)
    expect(slide.src).toContain('cdn.sanity.io')
    expect(slide.src).toContain('w=4000')
    expect(slide.alt).toBe('river alt')
  })

  it('caps a weak scan at its display max width and scales the height to match', () => {
    const weak = make('weak', [], { displayMaxWidth: 1000 })
    const [slide] = lightboxSlides([weak], 'weak', []).slides
    expect(slide.width).toBe(1000)
    expect(slide.height).toBe(750)
    expect(slide.src).toContain('w=1000')
  })

  it('leaves out artwork that has no image or no measured size, since it cannot be shown', () => {
    const noImage = make('none', [], { image: null })
    const unmeasured = make('unmeasured', [], { imageWidth: null, imageHeight: null })
    const { slides } = lightboxSlides([river, noImage, unmeasured], 'river', [])
    expect(slides.map((slide) => slide.slug)).toEqual(['river'])
  })

  it('falls back to the title when there is no alt text', () => {
    const [slide] = lightboxSlides([make('x', [], { altText: null })], 'x', []).slides
    expect(slide.alt).toBe('x')
  })
})
