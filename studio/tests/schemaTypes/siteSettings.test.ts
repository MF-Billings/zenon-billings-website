import { describe, expect, it } from 'vitest'
import siteSettings from '../../schemaTypes/siteSettings'

describe('siteSettings schema', () => {
  it('holds the editable site-wide copy', () => {
    expect(siteSettings.fields.map((field) => field.name)).toEqual(
      expect.arrayContaining([
        'artistName',
        'tagline',
        'bio',
        'profileImage',
        'contactEmail',
        'priceCurrency',
      ]),
    )
  })
})
