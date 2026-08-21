import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Vitest 4 transforms JSX through oxc with no plugin needed. @vitejs/plugin-react
// is deliberately absent: it exists for Vite dev-server Fast Refresh, which this
// project never runs, and its Babel 8 chain conflicts with the Babel 7 that
// @sanity/codegen requires.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['app/**', 'components/**', 'lib/**', 'scripts/**'],
      exclude: ['lib/sanity/sanity.types.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
