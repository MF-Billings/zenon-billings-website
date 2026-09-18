import { groupEventsByDate, type DatedEvent } from '@/lib/timeline/groupEventsByDate'

const event = (overrides: Partial<DatedEvent> & { _id: string }): DatedEvent => ({
  date: '2003-01-01',
  datePrecision: 'year',
  endDate: null,
  ...overrides,
})

describe('groupEventsByDate', () => {
  it('puts consecutive events with the same date in one group', () => {
    const a = event({ _id: 'a' })
    const b = event({ _id: 'b' })

    expect(groupEventsByDate([a, b])).toEqual([{ key: '2003', events: [a, b] }])
  })

  it('keeps events with different dates apart', () => {
    const a = event({ _id: 'a', date: '1988-01-01' })
    const b = event({ _id: 'b', date: '2003-01-01' })

    expect(groupEventsByDate([a, b]).map((group) => group.events)).toEqual([[a], [b]])
  })

  it('does not merge a point with a range that starts on the same date', () => {
    const point = event({ _id: 'a' })
    const range = event({ _id: 'b', endDate: '2006-01-01' })

    expect(groupEventsByDate([point, range])).toHaveLength(2)
  })

  it('does not merge dates that only match once truncated to a coarser precision', () => {
    const day = event({ _id: 'a', date: '2003-05-01', datePrecision: 'day' })
    const month = event({ _id: 'b', date: '2003-05-01', datePrecision: 'month' })

    expect(groupEventsByDate([day, month])).toHaveLength(2)
  })

  it('writes a range key as start/end for the datetime attribute', () => {
    const range = event({ _id: 'a', date: '1997-01-01', endDate: '2001-01-01' })

    expect(groupEventsByDate([range])[0].key).toBe('1997/2001')
  })

  it('returns no groups for no events', () => {
    expect(groupEventsByDate([])).toEqual([])
  })
})
