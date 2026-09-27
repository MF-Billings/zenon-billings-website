import {
  BRUSHSTROKE_NARROW_BREAKPOINT_EM,
  BRUSHSTROKE_WIDE_BREAKPOINT_EM,
} from '../../lib/brushstroke/brushstrokeWideBreakpoint'

// The breakpoints are in em of the browser default, which Playwright leaves at 16px.
export const WIDE = BRUSHSTROKE_WIDE_BREAKPOINT_EM * 16
export const NARROW = BRUSHSTROKE_NARROW_BREAKPOINT_EM * 16

// Phones of several widths and heights, the edge of the wide breakpoint, a
// landscape phone, and the widths just below each Pico container step, where
// the wordmark is widest relative to the container and most likely to run
// into the pines. Two heights at 375 prove the tree's place does not depend
// on the hero's height, which is what moved it between phones before. 280
// and 300 are a phone zoomed to 150%, either side of the width where the
// tree gives way to the name. Shared with the on-demand measure spec.
export const VIEWPORTS = [
  { width: 280, height: 600 },
  { width: 300, height: 600 },
  { width: 320, height: 640 },
  { width: 375, height: 667 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
  { width: 575, height: 800 },
  { width: 576, height: 800 },
  { width: WIDE - 1, height: 1000 },
  { width: WIDE, height: 1024 },
  { width: 844, height: 390 },
  { width: 971, height: 800 },
  { width: 1024, height: 768 },
  { width: 1279, height: 800 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1535, height: 900 },
  { width: 1536, height: 900 },
  { width: 1878, height: 1269 },
  { width: 1920, height: 1080 },
  // Wider than Pico's 1450px column: the brushstrokes follow the column, not the screen.
  { width: 2560, height: 1440 },
  { width: 3440, height: 1440 },
]
