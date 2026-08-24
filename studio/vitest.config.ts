import { defineConfig } from 'vitest/config'

// The Studio is its own package. Without this, Vitest walks up and picks up the
// site's config, whose jsdom setup and coverage rules do not apply to schemas.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
