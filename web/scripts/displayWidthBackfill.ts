/**
 * Pure planning for `backfill-display-width.ts`. Kept apart from the CLI so the
 * decision of what to patch is unit tested without a Sanity client.
 */

export const BACKFILL_CANDIDATES_QUERY = `
  *[_type == "artwork"]{
    _id,
    title,
    displayMaxWidth,
    "imageWidth": image.asset->metadata.dimensions.width
  }
`

export type BackfillCandidate = {
  _id: string
  title: string | null
  displayMaxWidth: number | null
  imageWidth: number | null
}

export type DisplayWidthPatch = {
  _id: string
  title: string | null
  displayMaxWidth: number
}

export type SkippedCandidate = {
  _id: string
  title: string | null
  reason: 'already set' | 'no image width'
}

export type BackfillPlan = {
  patches: DisplayWidthPatch[]
  skipped: SkippedCandidate[]
}

// A work the editor has already tuned is never touched: the whole point of the
// field is that the native width is only a starting guess.
export function planDisplayWidthBackfill(candidates: BackfillCandidate[]): BackfillPlan {
  const plan: BackfillPlan = { patches: [], skipped: [] }

  for (const { _id, title, displayMaxWidth, imageWidth } of candidates) {
    if (typeof displayMaxWidth === 'number' && displayMaxWidth > 0) {
      plan.skipped.push({ _id, title, reason: 'already set' })
    } else if (typeof imageWidth !== 'number' || imageWidth <= 0) {
      plan.skipped.push({ _id, title, reason: 'no image width' })
    } else {
      plan.patches.push({ _id, title, displayMaxWidth: Math.round(imageWidth) })
    }
  }

  return plan
}
