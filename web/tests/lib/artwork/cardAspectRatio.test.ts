import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CARD_ASPECT_RATIO } from '@/lib/artwork/cardAspectRatio'

// The stylesheet owns the design token; the TypeScript constant exists only so
// the CDN can crop thumbnails to the same shape at build time. This test is
// what keeps the two from drifting apart.
describe('CARD_ASPECT_RATIO', () => {
  it('matches the --card-ratio token in _tokens.scss', () => {
    const tokens = readFileSync(resolve(__dirname, '../../../styles/_tokens.scss'), 'utf8')
    const match = tokens.match(/--card-ratio:\s*(\d+)\s*\/\s*(\d+)\s*;/)

    expect(match, 'expected a --card-ratio: <w> / <h>; token').not.toBeNull()
    const [, width, height] = match!
    expect(CARD_ASPECT_RATIO).toBeCloseTo(Number(width) / Number(height), 10)
  })
})
