type Pixels = number | null | undefined

const isPositive = (value: Pixels): value is number => typeof value === 'number' && value > 0

/**
 * The widest an artwork image may render, in CSS pixels.
 *
 * The editor-set cap wins, but is clamped to the asset's native pixel width:
 * the CDN never upscales (fit=max), so anything wider only stretches pixels in
 * the browser. Null means no cap is known and the layout decides.
 */
export function resolveDisplayMaxWidth(
  displayMaxWidth: Pixels,
  nativeWidth: Pixels,
): number | null {
  const cap = isPositive(displayMaxWidth) ? displayMaxWidth : null
  const native = isPositive(nativeWidth) ? nativeWidth : null

  if (cap !== null && native !== null) return Math.min(cap, native)
  return cap ?? native
}
