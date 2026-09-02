import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'

describe('pigmentForMedium', () => {
  it('maps each known medium to its own pigment', () => {
    expect(pigmentForMedium('watercolour')).toBe('watercolour')
    expect(pigmentForMedium('drawing')).toBe('drawing')
    expect(pigmentForMedium('photography')).toBe('photography')
  })

  it(`maps the schema's explicit "other" medium to the fallback pigment`, () => {
    expect(pigmentForMedium('other')).toBe('other')
  })

  it('falls back rather than returning an undefined colour for an unknown medium', () => {
    expect(pigmentForMedium('oil')).toBe('other')
  })

  it('falls back when the medium is missing entirely', () => {
    expect(pigmentForMedium(null)).toBe('other')
    expect(pigmentForMedium(undefined)).toBe('other')
  })

  it('ignores casing and surrounding whitespace, which content entry can introduce', () => {
    expect(pigmentForMedium('Watercolour')).toBe('watercolour')
    expect(pigmentForMedium('  drawing ')).toBe('drawing')
  })
})
