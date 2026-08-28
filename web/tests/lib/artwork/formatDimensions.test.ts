import { formatDimensions } from '@/lib/artwork/formatDimensions'

describe('formatDimensions', () => {
  it('renders width by height with the unit', () => {
    expect(formatDimensions({ width: 30, height: 40, unit: 'cm' })).toBe('30 × 40 cm')
  })

  it('uses a multiplication sign, not the letter x', () => {
    expect(formatDimensions({ width: 30, height: 40, unit: 'cm' })).toContain('×')
    expect(formatDimensions({ width: 30, height: 40, unit: 'cm' })).not.toContain('x')
  })

  it('renders inches', () => {
    expect(formatDimensions({ width: 12, height: 16, unit: 'in' })).toBe('12 × 16 in')
  })

  it('renders a single known side on its own', () => {
    expect(formatDimensions({ width: null, height: 40, unit: 'cm' })).toBe('40 cm high')
    expect(formatDimensions({ width: 30, height: null, unit: 'cm' })).toBe('30 cm wide')
  })

  it('returns null when there is nothing to show', () => {
    expect(formatDimensions(null)).toBeNull()
    expect(formatDimensions({ width: null, height: null, unit: 'cm' })).toBeNull()
    expect(formatDimensions({ width: 30, height: 40, unit: null })).toBeNull()
  })

  it('drops trailing zeros so 30.0 reads as 30', () => {
    expect(formatDimensions({ width: 30.0, height: 40.5, unit: 'cm' })).toBe('30 × 40.5 cm')
  })
})
