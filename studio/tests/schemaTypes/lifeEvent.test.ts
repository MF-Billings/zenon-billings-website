import {describe, expect, it} from 'vitest'
import lifeEvent from '../../schemaTypes/lifeEvent'
import {schemaTypes} from '../../schemaTypes'

// Same approach as siteSettings.test.ts: defineType's per-field union hides
// optional keys, so the definitions are inspected through a plain shape.
type InspectableField = {
  name: string
  type: string
  description?: string
  initialValue?: unknown
  options?: {list?: Array<{value: string} | string>}
  of?: Array<{
    type: string
    styles?: Array<{value: string}>
    lists?: unknown[]
    marks?: {
      decorators?: Array<{value: string}>
      annotations?: Array<{name: string; fields: Array<{name: string; type: string}>}>
    }
  }>
}
const fields = lifeEvent.fields as unknown as InspectableField[]
const fieldNamed = (name: string) => fields.find((field) => field.name === name)

describe('lifeEvent schema', () => {
  it('is registered with the Studio', () => {
    expect(schemaTypes.map((type) => type.name)).toContain('lifeEvent')
  })

  it('holds a dated, titled event with optional text, picture and range', () => {
    expect(fields.map((field) => field.name)).toEqual(
      expect.arrayContaining([
        'title',
        'date',
        'datePrecision',
        'endDate',
        'summary',
        'image',
        'altText',
        'sortOrder',
      ]),
    )
  })

  it('stores dates as Sanity date fields, never free text', () => {
    expect(fieldNamed('date')?.type).toBe('date')
    expect(fieldNamed('endDate')?.type).toBe('date')
  })

  it('offers exactly day, month and year precision, defaulting to the full date', () => {
    const precision = fieldNamed('datePrecision')
    const values = precision?.options?.list?.map((item) =>
      typeof item === 'string' ? item : item.value,
    )

    expect(values).toEqual(['day', 'month', 'year'])
    expect(precision?.initialValue).toBe('day')
  })

  describe('summary', () => {
    const summaryBlock = () => fieldNamed('summary')?.of?.[0]

    it('is rich text so words can be hyperlinked', () => {
      expect(fieldNamed('summary')?.type).toBe('array')
      expect(summaryBlock()?.type).toBe('block')
    })

    it('offers a link annotation that stores a URL', () => {
      const link = summaryBlock()?.marks?.annotations?.find((mark) => mark.name === 'link')
      expect(link?.fields).toContainEqual(expect.objectContaining({name: 'href', type: 'url'}))
    })

    it('stays a short blurb: paragraphs only, no headings or lists', () => {
      expect(summaryBlock()?.styles?.map((style) => style.value)).toEqual(['normal'])
      expect(summaryBlock()?.lists).toEqual([])
    })
  })

  it('tells the editor what the precision and sort order are for', () => {
    expect(fieldNamed('datePrecision')?.description).toMatch(/shown/i)
    expect(fieldNamed('sortOrder')?.description).toMatch(/same date/i)
  })
})
