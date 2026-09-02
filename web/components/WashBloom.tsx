import type { Pigment } from '@/lib/artwork/pigmentForMedium'

type WashBloomProps = {
  pigment: Pigment
  className?: string
}

// Rendered on a small viewBox and scaled up by CSS: SVG filters are costed per
// rendered pixel, and a full-width bloom filtered at full resolution is slow on
// low-end phones.
export default function WashBloom({ pigment, className }: WashBloomProps) {
  return (
    <svg
      className={className ? `wash-bloom ${className}` : 'wash-bloom'}
      data-pigment={pigment}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g filter="url(#bloom-edge)">
        <circle cx="50" cy="50" r="38" fill="currentColor" opacity="0.55" />
        {/* Pigment settles darker at the edge as it dries; this is that ring. */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="3" />
      </g>
    </svg>
  )
}
