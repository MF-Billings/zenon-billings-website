import { describe, expect, it } from 'vitest'
import tag from '../../schemaTypes/tag'

describe('tag schema', () => {
  it('is a flat document type with name, slug, and optional category', () => {
    expect(tag.name).toBe('tag')
    expect(tag.fields.map((field) => field.name)).toEqual(
      expect.arrayContaining(['name', 'slug', 'category']),
    )
  })

  it('has no parent field — the hierarchy was deliberately flattened', () => {
    expect(tag.fields.map((field) => field.name)).not.toContain('parent')
  })
})
