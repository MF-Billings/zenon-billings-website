import { SAMPLE_LIFE_EVENTS, toLifeEventDocument } from '@/scripts/lifeEventSeed'

describe('SAMPLE_LIFE_EVENTS', () => {
  it('has more than one event that spans years, so range bars can be seen', () => {
    const multiYear = SAMPLE_LIFE_EVENTS.filter(
      (event) => event.endDate && event.endDate.slice(0, 4) !== event.date.slice(0, 4),
    )
    expect(multiYear.length).toBeGreaterThan(1)
  })

  it('has more than one year carrying several events', () => {
    const perYear = new Map<string, number>()
    for (const event of SAMPLE_LIFE_EVENTS) {
      const year = event.date.slice(0, 4)
      perYear.set(year, (perYear.get(year) ?? 0) + 1)
    }
    const busyYears = [...perYear.values()].filter((count) => count > 1)
    expect(busyYears.length).toBeGreaterThan(1)
  })

  it('has at least one pair of events sharing an identical date, to exercise the shared date cell', () => {
    const keys = SAMPLE_LIFE_EVENTS.map((e) => `${e.date}|${e.datePrecision}|${e.endDate ?? ''}`)
    expect(new Set(keys).size).toBeLessThan(keys.length)
  })

  it('orders events that share a date with an explicit sort order', () => {
    const byKey = new Map<string, number[]>()
    for (const event of SAMPLE_LIFE_EVENTS) {
      const key = `${event.date}|${event.datePrecision}|${event.endDate ?? ''}`
      byKey.set(key, [...(byKey.get(key) ?? []), event.sortOrder ?? Number.NaN])
    }
    for (const orders of byKey.values()) {
      if (orders.length > 1) expect(orders.every(Number.isInteger)).toBe(true)
    }
  })

  it('covers all three precisions', () => {
    const precisions = new Set(SAMPLE_LIFE_EVENTS.map((event) => event.datePrecision))
    expect(precisions).toEqual(new Set(['day', 'month', 'year']))
  })

  it('never ends a range before it starts, and uses unique titles as the re-run key', () => {
    for (const event of SAMPLE_LIFE_EVENTS) {
      if (event.endDate) expect(event.endDate >= event.date).toBe(true)
    }
    const titles = SAMPLE_LIFE_EVENTS.map((event) => event.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('marks at least one event as wanting a picture', () => {
    expect(SAMPLE_LIFE_EVENTS.some((event) => event.withPicture)).toBe(true)
  })
})

describe('toLifeEventDocument', () => {
  const sample = SAMPLE_LIFE_EVENTS.find((event) => event.withPicture)!

  it('builds a lifeEvent document from the sample fields', () => {
    const doc = toLifeEventDocument(sample, null)
    expect(doc._type).toBe('lifeEvent')
    expect(doc.title).toBe(sample.title)
    expect(doc.date).toBe(sample.date)
    expect(doc.datePrecision).toBe(sample.datePrecision)
  })

  it('attaches the given image asset with alt text when one is supplied', () => {
    const doc = toLifeEventDocument(sample, 'image-abc-1200x900-jpg')
    expect(doc.image).toEqual({
      _type: 'image',
      asset: { _type: 'reference', _ref: 'image-abc-1200x900-jpg' },
    })
    expect(doc.altText).toBe(sample.altText)
  })

  it('leaves image and altText out entirely when no asset is available', () => {
    const doc = toLifeEventDocument(sample, null)
    expect(doc).not.toHaveProperty('image')
    expect(doc).not.toHaveProperty('altText')
  })

  it('does not leak the seeding-only picture flag into the document', () => {
    expect(toLifeEventDocument(sample, null)).not.toHaveProperty('withPicture')
  })
})
