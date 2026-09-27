import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BRUSHSTROKE_NARROW_BREAKPOINT_EM,
  BRUSHSTROKE_WIDE_BREAKPOINT_EM,
  brushstrokeWideMediaQuery,
} from '@/lib/brushstroke/brushstrokeWideBreakpoint'

// The stylesheet owns the breakpoint: it is where the phone tree gives way to
// the two pines and the water. The <picture> in HomeHero has to switch files
// at the same width, so the constant mirrors it, and this test is what keeps
// the two from drifting apart.
describe('BRUSHSTROKE_WIDE_BREAKPOINT_EM', () => {
  it('matches $brushstroke-wide-breakpoint in _home.scss', () => {
    const home = readFileSync(resolve(__dirname, '../../../styles/_home.scss'), 'utf8')
    const match = home.match(/\$brushstroke-wide-breakpoint:\s*(\d+)em\s*;/)

    expect(match, 'expected a $brushstroke-wide-breakpoint: <n>em; variable').not.toBeNull()
    expect(BRUSHSTROKE_WIDE_BREAKPOINT_EM).toBe(Number(match![1]))
  })

  it('builds the media query the <picture> source uses', () => {
    expect(brushstrokeWideMediaQuery()).toBe('(min-width: 48em)')
  })
})

// Below the narrow step there is no room beside the artist's name for a
// tree at all, so the tree gives way. The e2e needs the value to know where
// to expect no tree.
describe('BRUSHSTROKE_NARROW_BREAKPOINT_EM', () => {
  it('matches $brushstroke-narrow-breakpoint in _home.scss', () => {
    const home = readFileSync(resolve(__dirname, '../../../styles/_home.scss'), 'utf8')
    const match = home.match(/\$brushstroke-narrow-breakpoint:\s*([\d.]+)em\s*;/)

    expect(match, 'expected a $brushstroke-narrow-breakpoint: <n>em; variable').not.toBeNull()
    expect(BRUSHSTROKE_NARROW_BREAKPOINT_EM).toBe(Number(match![1]))
  })
})
