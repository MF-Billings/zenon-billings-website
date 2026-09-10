/**
 * Width divided by height of an artwork card's mat.
 *
 * Mirrors the `--card-ratio` token in `styles/_tokens.scss`, which owns the
 * value for the design system. The CDN needs the same number at build time to
 * crop thumbnails so they fill the mat; `tests/lib/artwork/cardAspectRatio.test.ts`
 * fails if the two ever disagree.
 */
export const CARD_ASPECT_RATIO = 4 / 5
