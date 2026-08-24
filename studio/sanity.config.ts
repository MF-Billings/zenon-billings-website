import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const SINGLETON_ID = 'siteSettings'

export default defineConfig({
  name: 'default',
  title: "Zenon Billings' Website",

  projectId: 'nlwxmhc1',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Site Settings')
              .id(SINGLETON_ID)
              .child(S.document().schemaType('siteSettings').documentId(SINGLETON_ID)),
            S.divider(),
            S.documentTypeListItem('artwork').title('Artwork'),
            S.documentTypeListItem('tag').title('Tags'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Site Settings is reachable only through its fixed-ID list item above.
    templates: (templates) => templates.filter(({schemaType}) => schemaType !== 'siteSettings'),
  },
})
