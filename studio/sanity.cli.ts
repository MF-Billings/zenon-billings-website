import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'nlwxmhc1',
    dataset: 'production',
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
  schemaExtraction: {
    // Both workspaces register identical schema types; production is the canonical one.
    workspace: 'production',
  },
  typegen: {
    // Paths are relative to studio/; the site is the sibling web/ directory.
    path: '../web/{app,components,lib}/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../web/lib/sanity/sanity.types.ts',
    overloadClientMethods: true,
  },
})
