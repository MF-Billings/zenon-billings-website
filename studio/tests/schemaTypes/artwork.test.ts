import {describe, expect, it} from 'vitest'
import artwork from '../../schemaTypes/artwork'

// defineType returns a per-field discriminated union. These tests inspect the
// definitions structurally, so they read them through a plain shape instead.
type InspectableField = {name: string; options?: Record<string, unknown>; of?: unknown}
const fields = artwork.fields as unknown as InspectableField[]

const fieldNames = () => fields.map((field) => field.name)
const fieldNamed = (name: string) => fields.find((field) => field.name === name)

describe('artwork schema', () => {
  it('is a document type named artwork', () => {
    expect(artwork.type).toBe('document')
    expect(artwork.name).toBe('artwork')
  })

  it('exposes every field the site reads', () => {
    expect(fieldNames()).toEqual(
      expect.arrayContaining([
        'title',
        'slug',
        'description',
        'medium',
        'image',
        'altText',
        'dimensions',
        'yearCreated',
        'isFeatured',
        'price',
        'tags',
      ]),
    )
  })

  it('enables hotspot on the image so crops stay art-directed', () => {
    expect(fieldNamed('image')?.options).toMatchObject({hotspot: true})
  })

  it('derives the slug from the title', () => {
    expect(fieldNamed('slug')?.options).toMatchObject({source: 'title'})
  })

  it('references tag documents', () => {
    expect(fieldNamed('tags')?.of).toEqual([{type: 'reference', to: [{type: 'tag'}]}])
  })
})
