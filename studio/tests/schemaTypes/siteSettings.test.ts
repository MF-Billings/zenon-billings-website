import {describe, expect, it} from 'vitest'
import siteSettings from '../../schemaTypes/siteSettings'

const fieldNamed = (name: string) => siteSettings.fields.find((field) => field.name === name)

describe('siteSettings schema', () => {
  it('holds the editable site-wide copy', () => {
    expect(siteSettings.fields.map((field) => field.name)).toEqual(
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
    expect(siteSettings.fields.map((field) => field.name)).not.toContain('contactEmail')
  })

  it('warns the editor that the alias is published and must be disposable', () => {
    const alias = fieldNamed('publicContactAlias')

    expect(alias?.description).toMatch(/published/i)
    expect(alias?.description).toMatch(/forwarding alias/i)
    expect(alias?.description).toMatch(/never a personal/i)
  })
})
