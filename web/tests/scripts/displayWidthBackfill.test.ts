import { BACKFILL_CANDIDATES_QUERY, planDisplayWidthBackfill } from '@/scripts/displayWidthBackfill'

const artwork = (overrides: Partial<Parameters<typeof planDisplayWidthBackfill>[0][number]>) => ({
  _id: 'a1',
  title: 'River',
  displayMaxWidth: null,
  imageWidth: 1400,
  ...overrides,
})

describe('planDisplayWidthBackfill', () => {
  it('seeds the cap from the native pixel width when none is set', () => {
    const plan = planDisplayWidthBackfill([artwork({ _id: 'a1', imageWidth: 1400 })])
    expect(plan.patches).toEqual([{ _id: 'a1', title: 'River', displayMaxWidth: 1400 }])
    expect(plan.skipped).toEqual([])
  })

  it('leaves an editor-set cap alone so re-running never undoes hand tuning', () => {
    const plan = planDisplayWidthBackfill([artwork({ _id: 'a1', displayMaxWidth: 640 })])
    expect(plan.patches).toEqual([])
    expect(plan.skipped).toEqual([{ _id: 'a1', title: 'River', reason: 'already set' }])
  })

  it('skips a work whose asset has no pixel metadata rather than guessing', () => {
    const plan = planDisplayWidthBackfill([artwork({ _id: 'a1', imageWidth: null })])
    expect(plan.patches).toEqual([])
    expect(plan.skipped).toEqual([{ _id: 'a1', title: 'River', reason: 'no image width' }])
  })

  it('rounds the width to a whole pixel to satisfy the schema integer rule', () => {
    const plan = planDisplayWidthBackfill([artwork({ imageWidth: 1400.6 })])
    expect(plan.patches[0]?.displayMaxWidth).toBe(1401)
  })

  it('reads only what the plan needs, from every artwork', () => {
    expect(BACKFILL_CANDIDATES_QUERY).toContain('_type == "artwork"')
    expect(BACKFILL_CANDIDATES_QUERY).toContain('displayMaxWidth')
    expect(BACKFILL_CANDIDATES_QUERY).toContain(
      '"imageWidth": image.asset->metadata.dimensions.width',
    )
  })
})
