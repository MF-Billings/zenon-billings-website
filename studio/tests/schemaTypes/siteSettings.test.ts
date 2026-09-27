import {describe, expect, it} from 'vitest'
import siteSettings from '../../schemaTypes/siteSettings'

// defineType returns a per-field discriminated union, so `description` is not
// present on every arm. Read the definitions through a plain shape instead —
// the same approach artwork.test.ts takes.
type InspectableField = {name: string; description?: string}
const fields = siteSettings.fields as unknown as InspectableField[]

const fieldNamed = (name: string) => fields.find((field) => field.name === name)

describe('siteSettings schema', () => {
  it('holds the editable site-wide copy', () => {
    expect(fields.map((field) => field.name)).toEqual(
      expect.arrayContaining(['artistName', 'tagline', 'bio', 'profileImage', 'priceCurrency']),
    )
  })

  it('holds a statement with an optional heading, portrait and attribution', () => {
    expect(fields.map((field) => field.name)).toEqual(
      expect.arrayContaining([
        'statementHeading',
        'statement',
        'statementImage',
        'statementAttribution',
      ]),
    )
  })

  it('keeps the statement to plain paragraphs', () => {
    const statement = fieldNamed('statement') as unknown as {
      of: Array<{styles?: Array<{value: string}>; lists?: unknown[]}>
    }
    const block = statement.of[0]

    expect(block.styles?.map((style) => style.value)).toEqual(['normal'])
    expect(block.lists).toEqual([])
  })

  it('tells the editor the attribution is optional and what leaving it blank does', () => {
    expect(fieldNamed('statementAttribution')?.description).toMatch(/unattributed/i)
  })

  it('offers no field that would put an email address on a published page', () => {
    expect(fields.map((field) => field.name)).not.toContain('contactEmail')
    expect(fields.map((field) => field.name)).not.toContain('publicContactAlias')
  })
})
