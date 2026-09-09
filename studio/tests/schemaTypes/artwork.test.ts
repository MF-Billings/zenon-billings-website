import {describe, expect, it} from 'vitest'
import artwork from '../../schemaTypes/artwork'

// defineType returns a per-field discriminated union. These tests inspect the
// definitions structurally, so they read them through a plain shape instead.
type InspectableField = {
  name: string
  type?: string
  options?: Record<string, unknown>
  of?: unknown
  fields?: InspectableField[]
}
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
        'artistNote',
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

  it('separates the artist note from the catalogue description', () => {
    expect(fieldNamed('description')?.type).toBe('text')
    expect(fieldNamed('artistNote')?.type).toBe('text')
  })

  it('offers every medium the collection actually uses', () => {
    const values = (
      fieldNamed('medium')?.options?.list as {title: string; value: string}[] | undefined
    )?.map((option) => option.value)

    expect(values).toEqual([
      'watercolour',
      'acrylic',
      'oil',
      'pastel',
      'drawing',
      'photography',
      'mixed-media',
      'other',
    ])
  })

  it('enables hotspot on the image so crops stay art-directed', () => {
    expect(fieldNamed('image')?.options).toMatchObject({hotspot: true})
  })

  it('derives the slug from the title', () => {
    expect(fieldNamed('slug')?.options).toMatchObject({source: 'title'})
  })

  it('models dimensions as structured width, height, and unit', () => {
    const dimensions = fieldNamed('dimensions')
    expect(dimensions?.type).toBe('object')

    expect(dimensions?.fields?.map((field) => field.name)).toEqual(
      expect.arrayContaining(['width', 'height', 'unit']),
    )
  })

  it('offers only units that map to a Schema.org unitCode', () => {
    const unit = fieldNamed('dimensions')?.fields?.find((field) => field.name === 'unit')
    expect(unit?.options?.list).toEqual(['cm', 'in'])
  })

  it('references tag documents', () => {
    expect(fieldNamed('tags')?.of).toEqual([{type: 'reference', to: [{type: 'tag'}]}])
  })
})
