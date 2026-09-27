import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({name: 'artistName', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'tagline', type: 'string'}),
    defineField({name: 'bio', type: 'array', of: [{type: 'block'}]}),
    defineField({name: 'profileImage', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'statementHeading',
      title: 'Statement heading',
      type: 'string',
      description: 'Shown above the statement as a section heading. Leave blank for no heading.',
    }),
    defineField({
      name: 'statement',
      type: 'array',
      description:
        'A few sentences about the work and what this site is for, shown on the home page. ' +
        'Three to six sentences reads best.',
      of: [
        defineArrayMember({
          type: 'block',
          // The statement is set large as a single voice; headings and lists would break it.
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [{title: 'Emphasis', value: 'em'}],
            annotations: [],
          },
        }),
      ],
    }),
    defineField({
      name: 'statementImage',
      title: 'Statement image',
      type: 'image',
      description: 'A second photo of the artist, shown small beside the statement.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'statementAttribution',
      title: 'Statement attribution',
      type: 'string',
      description:
        'Who the statement is by, signed beneath it. Leave blank to publish it unattributed.',
    }),
    defineField({
      name: 'priceCurrency',
      type: 'string',
      description: 'ISO 4217 code used in artwork JSON-LD offers, e.g. USD.',
      initialValue: 'USD',
    }),
  ],
})
