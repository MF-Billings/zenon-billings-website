import {defineConfig, type WorkspaceOptions} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const SINGLETON_ID = 'siteSettings'

/**
 * One workspace per dataset so the Studio can switch between the artist's real
 * content and the seeded sample data without editing config or rebuilding.
 */
function workspaceForDataset(dataset: string, title: string): WorkspaceOptions {
  return {
    name: dataset,
    title,
    basePath: `/${dataset}`,
    projectId: 'nlwxmhc1',
    dataset,
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
      visionTool({defaultDataset: dataset}),
    ],
    schema: {
      types: schemaTypes,
      // Site Settings is reachable only through its fixed-ID list item above.
      templates: (templates) => templates.filter(({schemaType}) => schemaType !== 'siteSettings'),
    },
  }
}

export default defineConfig([
  workspaceForDataset('production', 'Production'),
  workspaceForDataset('development', 'Development (sample data)'),
])
