import type { ReactNode } from 'react'

// A viewport-wide, zero-height band that clips its own horizontal overflow, so
// a painted brushstroke inside it can hang off the screen's edge without giving
// the page a horizontal scrollbar. Inside it, a column with the page's
// content-column geometry (Pico's .container) is what the brushstrokes are
// positioned against, so on a wide screen they follow the content rather than
// the screen's edge. The stylesheet (.brushstroke-layer in _materials.scss)
// does the work; this is the markup it needs.
//
// Two contracts, both enforced by the home e2e suite:
// - Place it as a block-flow child, right where the brushstrokes should hang
//   from: its `top: auto` is its static position, so its top is the bottom of
//   whatever precedes it. A grid or flex parent would ignore that.
// - It is only viewport-wide while no ancestor is a containing block (non-static
//   position, transform, filter, contain, container-type), and its children only
//   paint under the paper grain while no ancestor is a stacking context.
export default function BrushstrokeLayer({ children }: { children?: ReactNode }) {
  return (
    <div className="brushstroke-layer" aria-hidden="true">
      <div className="container brushstroke-layer__column">{children}</div>
    </div>
  )
}
