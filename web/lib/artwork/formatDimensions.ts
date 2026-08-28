import type { Artwork } from '@/lib/sanity/types'

type Dimensions = Artwork['dimensions']

// Number#toString already drops trailing zeros; this names the intent.
const trim = (value: number) => String(value)

export function formatDimensions(dimensions: Dimensions | null): string | null {
  if (!dimensions?.unit) return null

  const { width, height, unit } = dimensions
  const hasWidth = typeof width === 'number'
  const hasHeight = typeof height === 'number'

  if (hasWidth && hasHeight) return `${trim(width)} × ${trim(height)} ${unit}`
  if (hasHeight) return `${trim(height)} ${unit} high`
  if (hasWidth) return `${trim(width)} ${unit} wide`

  return null
}
