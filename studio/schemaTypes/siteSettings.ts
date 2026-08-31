import {defineField, defineType} from 'sanity'

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
      name: 'publicContactAlias',
      title: 'Public contact alias',
      type: 'string',
      description:
        'Published on the contact page in plain sight, so scrapers will find it. Use a ' +
        'forwarding alias you can delete and replace — never a personal inbox.',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'priceCurrency',
      type: 'string',
      description: 'ISO 4217 code used in artwork JSON-LD offers, e.g. USD.',
      initialValue: 'USD',
    }),
  ],
})
