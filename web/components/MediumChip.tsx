import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'

export default function MediumChip({ medium }: { medium: string | null | undefined }) {
  if (!medium) return null

  return (
    <span className="medium-chip" data-pigment={pigmentForMedium(medium)}>
      {medium}
    </span>
  )
}
