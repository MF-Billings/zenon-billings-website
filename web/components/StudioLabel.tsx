import { Fragment, type ReactElement } from 'react'
import { formatDimensions } from '@/lib/artwork/formatDimensions'
import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'
import type { Artwork } from '@/lib/sanity/types'

type StudioLabelProps = {
  artwork: Pick<Artwork, 'yearCreated' | 'medium' | 'dimensions'>
  className?: string
  // Opt-in only: the gallery card renders this same component per tile, where a
  // "Year: … Medium: … Dimensions: …" prefix on every card would be repetitive
  // noise for screen reader users. The detail page is a single museum-placard
  // line, where the medium in particular is otherwise ambiguous, so it opts in.
  withFieldNames?: boolean
}

// A field name rendered as a sibling before the value, not inside it, so the
// medium's own span keeps holding only the medium text (existing tests query
// it by that text and then assert its data-pigment attribute).
function FieldName({ children }: { children: string }) {
  return <span className="visually-hidden">{children}</span>
}

export default function StudioLabel({ artwork, className, withFieldNames }: StudioLabelProps) {
  const dimensions = formatDimensions(artwork.dimensions ?? null)

  const parts = [
    artwork.yearCreated ? (
      <Fragment key="year">
        {withFieldNames && <FieldName>Year:</FieldName>}
        <span>{artwork.yearCreated}</span>
      </Fragment>
    ) : null,
    artwork.medium ? (
      <Fragment key="medium">
        {withFieldNames && <FieldName>Medium:</FieldName>}
        <span className="studio-label__medium" data-pigment={pigmentForMedium(artwork.medium)}>
          {artwork.medium}
        </span>
      </Fragment>
    ) : null,
    dimensions ? (
      <Fragment key="dimensions">
        {withFieldNames && <FieldName>Dimensions:</FieldName>}
        <span>{dimensions}</span>
      </Fragment>
    ) : null,
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
