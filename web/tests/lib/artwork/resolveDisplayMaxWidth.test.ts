import { resolveDisplayMaxWidth } from '@/lib/artwork/resolveDisplayMaxWidth'

describe('resolveDisplayMaxWidth', () => {
  it('prefers the editor-set cap over the native pixel width', () => {
    expect(resolveDisplayMaxWidth(640, 2400)).toBe(640)
  })

  it('falls back to the native pixel width so a scan is never stretched past its source', () => {
    expect(resolveDisplayMaxWidth(null, 900)).toBe(900)
    expect(resolveDisplayMaxWidth(undefined, 900)).toBe(900)
  })

  it('never widens past the native pixels even when the editor asks for more', () => {
    expect(resolveDisplayMaxWidth(3000, 900)).toBe(900)
  })

  it('returns null when neither value is known', () => {
    expect(resolveDisplayMaxWidth(null, null)).toBeNull()
    expect(resolveDisplayMaxWidth(undefined, undefined)).toBeNull()
  })

  it('ignores a non-positive cap', () => {
    expect(resolveDisplayMaxWidth(0, 900)).toBe(900)
    expect(resolveDisplayMaxWidth(-10, null)).toBeNull()
  })
})
