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
  typegen: {
    // Paths are relative to studio/, so they reach up into the site with ../
    path: '../{app,components,lib}/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../lib/sanity/sanity.types.ts',
    overloadClientMethods: true,
  },
})
