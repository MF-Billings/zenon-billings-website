import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'lifeEvent',
  title: 'Life event',
  type: 'document',
  description: "A key date in the artist's life, shown on the about page timeline.",
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'date',
      type: 'date',
      description:
        'Pick a full date even when only the month or year is known; the precision ' +
        'below decides how much of it is shown.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'datePrecision',
      title: 'Date precision',
      type: 'string',
      description:
        'How much of the date is shown: "August 18, 1970", "August 1970" or "1970".',
      options: {
        list: [
          {title: 'Day', value: 'day'},
          {title: 'Month', value: 'month'},
          {title: 'Year', value: 'year'},
        ],
        layout: 'radio',
      },
      initialValue: 'day',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'End date',
      type: 'date',
      description:
        'Set this to make the event a range, shown as "1997–2001". Uses the same ' +
        'precision as the start date.',
      validation: (rule) =>
        rule.min(rule.valueOfField('date')).error('The end date cannot be before the start date.'),
    }),
    defineField({name: 'summary', type: 'text', rows: 3}),
    defineField({name: 'image', type: 'image', options: {hotspot: true}}),
    defineField({
      name: 'altText',
      type: 'string',
      description: 'Describes the image for screen readers and when the image fails to load.',
      validation: (rule) =>
        rule.custom((altText, context) =>
          context.document?.image && !altText ? 'Required when an image is set.' : true,
        ),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort order',
      type: 'number',
      description:
        'Only matters for events that share the same date: lower numbers come first.',
      validation: (rule) => rule.integer(),
    }),
  ],
  orderings: [
    {
      title: 'Date, oldest first',
      name: 'dateAsc',
      by: [
        {field: 'date', direction: 'asc'},
        {field: 'sortOrder', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {title: 'title', date: 'date', endDate: 'endDate', media: 'image'},
    prepare: ({title, date, endDate, media}) => ({
      title,
      subtitle: endDate ? `${date} – ${endDate}` : date,
      media,
    }),
  },
})
