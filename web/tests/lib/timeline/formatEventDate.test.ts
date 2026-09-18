import { formatEventDate, isoForPrecision } from '@/lib/timeline/formatEventDate'

describe('formatEventDate', () => {
  it('shows the full date at day precision', () => {
    expect(formatEventDate({ date: '1970-08-18', datePrecision: 'day' })).toBe('August 18, 1970')
  })

  it('drops the day at month precision', () => {
    expect(formatEventDate({ date: '1992-09-01', datePrecision: 'month' })).toBe('September 1992')
  })

  it('keeps only the year at year precision', () => {
    expect(formatEventDate({ date: '1988-01-01', datePrecision: 'year' })).toBe('1988')
  })

  it('treats a missing precision as a full date', () => {
    expect(formatEventDate({ date: '1970-08-18', datePrecision: null })).toBe('August 18, 1970')
  })

  it('does not shift the date across the UTC midnight boundary', () => {
    // A naive `new Date('1970-08-18')` renders as August 17 west of Greenwich.
    expect(formatEventDate({ date: '1970-08-18', datePrecision: 'day' })).toContain('18')
  })

  describe('ranges', () => {
    it('collapses a year range to the two years', () => {
      expect(
        formatEventDate({ date: '1997-01-01', datePrecision: 'year', endDate: '2001-01-01' }),
      ).toBe('1997–2001')
    })

    it('collapses a month range inside one year', () => {
      expect(
        formatEventDate({ date: '2015-03-01', datePrecision: 'month', endDate: '2015-08-01' }),
      ).toBe('March–August 2015')
    })

    it('collapses a day range inside one month', () => {
      expect(
        formatEventDate({ date: '1970-08-18', datePrecision: 'day', endDate: '1970-08-22' }),
      ).toBe('August 18–22, 1970')
    })

    it('shows a single value when the range is empty at its precision', () => {
      expect(
        formatEventDate({ date: '2015-03-01', datePrecision: 'year', endDate: '2015-08-01' }),
      ).toBe('2015')
    })
  })
})

describe('isoForPrecision', () => {
  it('truncates the ISO date to the precision for the datetime attribute', () => {
    expect(isoForPrecision('1970-08-18', 'day')).toBe('1970-08-18')
    expect(isoForPrecision('1970-08-18', 'month')).toBe('1970-08')
    expect(isoForPrecision('1970-08-18', 'year')).toBe('1970')
    expect(isoForPrecision('1970-08-18', null)).toBe('1970-08-18')
  })
})
