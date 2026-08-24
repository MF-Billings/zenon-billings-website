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
      type: 'string',
      description: 'Physical size as displayed, e.g. 30 x 40 cm.',
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
