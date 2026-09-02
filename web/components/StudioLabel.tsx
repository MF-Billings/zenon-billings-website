import { Fragment, type ReactElement } from 'react'
import { formatDimensions } from '@/lib/artwork/formatDimensions'
import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'
import type { Artwork } from '@/lib/sanity/types'

type StudioLabelProps = {
  artwork: Pick<Artwork, 'yearCreated' | 'medium' | 'dimensions'>
  className?: string
}

export default function StudioLabel({ artwork, className }: StudioLabelProps) {
  const dimensions = formatDimensions(artwork.dimensions ?? null)

  const parts = [
    artwork.yearCreated ? <span key="year">{artwork.yearCreated}</span> : null,
    artwork.medium ? (
      <span
        key="medium"
        className="studio-label__medium"
        data-pigment={pigmentForMedium(artwork.medium)}
      >
        {artwork.medium}
      </span>
    ) : null,
    dimensions ? <span key="dimensions">{dimensions}</span> : null,
  ].filter((part): part is ReactElement => part !== null)

  if (parts.length === 0) return null

  return (
    <p className={className ? `studio-label ${className}` : 'studio-label'}>
      {parts.map((part, index) => (
        <Fragment key={part.key}>
          {index > 0 && <span aria-hidden="true"> · </span>}
          {part}
        </Fragment>
      ))}
    </p>
  )
}
