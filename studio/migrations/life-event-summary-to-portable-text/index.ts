import {at, defineMigration, set} from 'sanity/migrate'
import {plainTextToPortableText} from './plainTextToPortableText'

// `summary` used to be a plain `text` field. Documents written before the change
// still hold a string there, which the Portable Text editor cannot open.
export default defineMigration({
  title: 'Convert plain-text life event summaries to Portable Text',
  documentTypes: ['lifeEvent'],
  migrate: {
    document(doc) {
      if (typeof doc.summary !== 'string') return undefined
      return at('summary', set(plainTextToPortableText(doc.summary)))
    },
  },
})
