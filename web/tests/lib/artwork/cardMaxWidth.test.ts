import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CARD_MAX_WIDTH_REM } from '@/lib/artwork/cardMaxWidth'

// The stylesheet owns the design token; the TypeScript constant exists only so
// the card can tell the browser (via `sizes`) how wide a thumbnail can ever be.
// This test is what keeps the two from drifting apart.
describe('CARD_MAX_WIDTH_REM', () => {
  it('matches the --card-width-max token in _tokens.scss', () => {
    const tokens = readFileSync(resolve(__dirname, '../../../styles/_tokens.scss'), 'utf8')
    const match = tokens.match(/--card-width-max:\s*([\d.]+)rem\s*;/)

    expect(match, 'expected a --card-width-max: <n>rem; token').not.toBeNull()
    expect(CARD_MAX_WIDTH_REM).toBe(Number(match![1]))
  })
})
