/**
 * Widest an artwork card may grow, in rem.
 *
 * Mirrors the `--card-width-max` token in `styles/_tokens.scss`, which owns the
 * value for the design system. The card needs the same number at build time
 * for the thumbnail's `sizes` attribute, so the browser never fetches a
 * rendition sized for a wider card than the grid will ever draw;
 * `tests/lib/artwork/cardMaxWidth.test.ts` fails if the two ever disagree.
 */
export const CARD_MAX_WIDTH_REM = 14
