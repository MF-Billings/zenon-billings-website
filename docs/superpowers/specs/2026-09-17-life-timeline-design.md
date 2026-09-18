# Life Timeline — Design Spec

**Date:** 2026-09-17
**Status:** Approved (direction chosen from three rendered mockups)
**Scope:** New `lifeEvent` content type in `studio/`; new query, component, SCSS partial and
about-page section in `web/`. No new dependencies.

## Goal

Show the key dates of the artist's life on the about page, below the biography, as a
vertical timeline the editor maintains in the Studio without a redeploy.

## Direction

**The ledger.** A single vertical rail with the date pinned in its own column, like entries
in a studio daybook. Each event is a `.paper-sheet` tipped onto the page at the site's
`--edge-tilt`, alternating direction. The rail node is a square in the wordmark's badge blue;
a date range stretches the node into a short bar. Needs no JavaScript.

Rejected: a horizontal proportional strip (sideways scrolling, needs JS for the active tick)
and chapters grouped by decade (only earns its structure with events across three or more
decades; ranges that cross a decade have no single home).

## Content model

New document type `lifeEvent`:

| Field           | Type     | Notes                                                                   |
| --------------- | -------- | ----------------------------------------------------------------------- |
| `title`         | string   | required                                                                |
| `date`          | date     | required. Stored as a full `YYYY-MM-DD`; precision below says how much of it is shown |
| `datePrecision` | string   | `day` \| `month` \| `year`; default `day`                               |
| `endDate`       | date     | optional; makes the event a range. Must not be before `date`            |
| `summary`       | text     | optional short text                                                     |
| `image`         | image    | optional, hotspot on                                                    |
| `altText`       | string   | required when `image` is set                                            |
| `sortOrder`     | number   | optional integer; orders events that share a date                       |

Listed in the Studio structure under Site Settings, alongside Artwork and Tags.

## Query

`LIFE_EVENTS_QUERY`: all `lifeEvent` documents with a `date`, ordered by
`date asc, coalesce(sortOrder, 0) asc, _createdAt asc`. Projects `_id, title, date,
datePrecision, endDate, summary, image, altText`.

## Rendering rules

- **Date format** (`lib/timeline/formatEventDate.ts`): `Intl.DateTimeFormat('en-US')`, UTC.
  `day` → "August 18, 1970"; `month` → "September 1992"; `year` → "1988". A range uses
  `formatRange`, which collapses the shared parts: "1997–2001", "March–August 2015",
  "August 18–22, 1970". The `<time datetime>` attribute carries the ISO value truncated to
  the precision; a range is written `start/end`.
- **Same date** (`lib/timeline/groupEventsByDate.ts`): consecutive events with the same
  `date`, `datePrecision` and `endDate` share one date cell and stack their sheets.
- **Empty**: the section renders nothing when there are no events, so a fresh dataset shows
  the about page exactly as today.
- **Heading**: "key dates", `.lowercase-chrome`, followed by an `InkRule`, matching the
  home page's featured section.
- **Image**: rendered with `SanityImage` inside the sheet at a fixed small width; the sheet
  becomes a two-column grid when an image is present and stacks below 520px.

## Files

- `studio/schemaTypes/lifeEvent.ts`, registered in `schemaTypes/index.ts` and
  `sanity.config.ts`; test in `studio/tests/schemaTypes/lifeEvent.test.ts`.
- `web/lib/sanity/queries.ts` (+ regenerated `sanity.types.ts`, `types.ts` alias).
- `web/lib/timeline/formatEventDate.ts`, `web/lib/timeline/groupEventsByDate.ts`.
- `web/components/LifeTimeline.tsx`.
- `web/styles/_life-timeline.scss`, registered in `style.scss`.
- `web/app/about/page.tsx` fetches and renders the section.
- README: content type documented under the content sections.

## Testing

Vitest: formatter (all precisions, ranges, same-year collapse), grouping, component (empty
state, date cell shared by same-date events, range node modifier, image rendering, heading),
query string assertions, Studio schema shape. Playwright is not extended: the development
dataset has no events yet, and the section is empty by design when there are none.
