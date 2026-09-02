const PIGMENTED_MEDIUMS = ['watercolour', 'drawing', 'photography'] as const

export type Pigment = (typeof PIGMENTED_MEDIUMS)[number] | 'other'

export function pigmentForMedium(medium: string | null | undefined): Pigment {
  const normalized = medium?.trim().toLowerCase()
  const match = PIGMENTED_MEDIUMS.find((pigment) => pigment === normalized)
  return match ?? 'other'
}
