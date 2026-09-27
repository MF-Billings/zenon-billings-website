import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  // Playwright tests the real static export, not the dev server. Rebuild
  // before running: a stale out/ passes or fails on the previous change.
  webServer: {
    command: 'npx serve out -l 4173',
    url: 'http://localhost:4173',
    // Outside CI an existing server on 4173 is reused, whoever started it.
    // With several checkouts on one machine that can be another checkout's
    // out/. If in doubt, copy this file to an untracked one on a free port
    // and pass it with --config.
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
