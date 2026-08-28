import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'description', type: 'text', rows: 4}),
    defineField({
      name: 'medium',
      type: 'string',
      options: {
        list: [
          {title: 'Watercolour', value: 'watercolour'},
          {title: 'Drawing', value: 'drawing'},
          {title: 'Photography', value: 'photography'},
          {title: 'Other', value: 'other'},
        ],
      },
      initialValue: 'watercolour',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      options: {hotspot: true},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'altText',
      type: 'string',
      description: 'Describes the image for screen readers and when the image fails to load.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'dimensions',
      type: 'object',
      description: 'Physical size of the work.',
      fields: [
        defineField({name: 'width', type: 'number', validation: (rule) => rule.positive()}),
        defineField({name: 'height', type: 'number', validation: (rule) => rule.positive()}),
        defineField({
          name: 'unit',
          type: 'string',
          // Kept to units with a UN/CEFACT code, so the JSON-LD QuantitativeValue
          // can always state a unitCode rather than free text.
          options: {list: ['cm', 'in']},
          initialValue: 'cm',
        }),
      ],
    }),
    defineField({name: 'yearCreated', type: 'number'}),
    defineField({name: 'isFeatured', type: 'boolean', initialValue: false}),
    defineField({name: 'price', type: 'number'}),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tag'}]}],
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'medium', media: 'image'}},
})
