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
      expect.arrayContaining([
        'artistName',
        'tagline',
        'bio',
        'profileImage',
        'publicContactAlias',
        'priceCurrency',
      ]),
    )
  })

  it('offers no field that invites a personal inbox into published pages', () => {
    expect(fields.map((field) => field.name)).not.toContain('contactEmail')
  })

  it('warns the editor that the alias is published and must be disposable', () => {
    const alias = fieldNamed('publicContactAlias')

    expect(alias?.description).toMatch(/published/i)
    expect(alias?.description).toMatch(/forwarding alias/i)
    expect(alias?.description).toMatch(/never a personal/i)
  })
})
