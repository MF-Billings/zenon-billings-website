// Mirrors $brushstroke-wide-breakpoint in styles/_home.scss, which owns the
// value: below it the phone tree hangs in the corner, from it the two pines and
// the water. The <picture> in HomeHero has to switch files at the same width
// the stylesheet switches the composition. A unit test fails if they drift.
export const BRUSHSTROKE_WIDE_BREAKPOINT_EM = 48

export const brushstrokeWideMediaQuery = () => `(min-width: ${BRUSHSTROKE_WIDE_BREAKPOINT_EM}em)`

// Mirrors $brushstroke-narrow-breakpoint in the same stylesheet: below it
// there is no room beside the artist's name for a tree at all, so the tree
// gives way. Only the e2e reads this, to know where to expect no tree.
export const BRUSHSTROKE_NARROW_BREAKPOINT_EM = 18.75
