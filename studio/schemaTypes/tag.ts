import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) => rule.required().regex(/^[a-zA-Z-]+$/, {name: 'letters and hyphens only'}),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      description: 'Optional grouping label, e.g. medium or subject.',
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'category'}},
})
