import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  // Sanity's CDN handles resizing; Next's optimizer needs a server we don't have.
  images: { unoptimized: true },
  // Emits directory/index.html pairs, which Cloudflare Pages serves without redirect hops.
  trailingSlash: true,
  sassOptions: {
    loadPaths: ['./node_modules/@picocss/pico/scss'],
    // Raised by Pico's own source, which AGENTS.md forbids editing.
    silenceDeprecations: ['if-function'],
  },
}

export default nextConfig
