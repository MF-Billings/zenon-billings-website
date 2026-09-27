# Zenon Billings — Artist Portfolio

A statically-exported Next.js portfolio backed by Sanity, hosted on Cloudflare Pages.
There is no origin server: every page is built to static HTML at deploy time, and the
only runtime network call is the contact form posting to a third-party endpoint.

- **Content:** [Sanity](https://sanity.io) project `nlwxmhc1` (no application database)
- **Rendering:** Next.js App Router in `output: 'export'` mode
- **Styling:** [Pico.css](https://picocss.com) via SCSS
- **Lightbox:** [PhotoSwipe](https://photoswipe.com) on artwork pages
- **Hosting:** Cloudflare Pages

See `AGENTS.md` for project rules and `docs/execution_plan.md` for the architecture rationale.

## Layout

Two independent packages side by side. The repository root has **no dependencies** — that
is deliberate, and `AGENTS.md` explains why.

```text
zenon-billings/
├── web/       # the Next.js site
├── studio/    # Sanity Studio
└── docs/
```

## Design system

The site's visual identity is **studio / pigment**: the chrome is made of the same materials
as the work — paper, water, pigment. The full rationale and the rejected alternatives are in
`docs/superpowers/specs/2026-09-01-studio-pigment-design.md`.

### Two rules

1. **Discipline in the type, handmade in the surfaces.** Personality belongs to the
   background plane — paper, drawn rules. No handwriting faces. No rotated text.
2. **Texture, not decoration.** The paper grain and the ink rules are the whole surface
   vocabulary. There are no wash blooms; the spec's one-per-viewport rule is now zero.

The failure mode is scrapbook, and it arrives by accumulation. If the design starts drifting,
check these two rules first.

### Where to change what

| Change                                          | File                          |
| ----------------------------------------------- | ----------------------------- |
| A colour, spacing value, or the mat ratio[^1]   | `web/styles/_tokens.scss`     |
| How big a gallery card can grow[^2]             | `web/styles/_tokens.scss`     |
| Type scale, the studio label, or the name badge | `web/styles/_typography.scss` |
| Paper texture, ink rules, deckle edge          | `web/styles/_materials.scss`  |
| Anything specific to one page                   | `web/styles/_<area>.scss`     |

[^1]: Also update `CARD_ASPECT_RATIO` in `web/lib/artwork/cardAspectRatio.ts`; the CDN crops
    thumbnails to it. A unit test fails if it no longer matches the token.

[^2]: `--card-width-min` is the narrowest grid track (so it decides how many columns fit)
    and `--card-width-max` caps the card inside it, so a wide viewport shows more cards
    rather than bigger ones. Also update `CARD_MAX_WIDTH_REM` in
    `web/lib/artwork/cardMaxWidth.ts`; it feeds the thumbnail's `sizes` attribute. A unit
    test fails if it no longer matches the token.

### Palette

Pigments are named for what they are, never for where they are used. Each artwork medium maps
to one, in `web/styles/_tokens.scss`. `web/lib/artwork/pigmentForMedium.ts` normalises a raw
medium string to one of the medium keys below (`'watercolour' | 'drawing' | 'photography' |
'other'`) — including the fallback for unrecognised values — which components then use to
look up the pigment via `data-pigment`.

| Medium      | Pigment      | Hex       | Contrast (measured on the rendered ground) |
| ----------- | ------------ | --------- | ------------------------------------------- |
| watercolour | indigo       | `#2e3a5c` | 9.60:1                                       |
| drawing     | payne's grey | `#3d4f5c` | 7.28:1                                       |
| photography | burnt sienna | `#9c5433` | 4.83:1                                       |
| other       | raw umber    | `#6b5b45` | 5.61:1                                       |

Body text is `--ink-primary` (`#2a3138`, 11.29:1); studio labels are `--ink-muted`
(`#6e6a63`, 4.61:1). These figures are measured against the page's actual rendered
background — `body::before`'s tiled grain layer, at 50% opacity in `multiply` blend, darkens
flat `--paper-cold-press` (`#f7f3ec`) to a measured composite around `rgb(241, 237, 230)`, and
that composite is what text outside a `.paper-sheet` sits on, not the flat token. **Any new
text colour must clear 4.5:1 against the rendered ground, not just the `--paper-cold-press`
token** (3:1 for display sizes at 24px or larger) — see the spec's Contrast section for how to
measure it. The palette bends to the contrast requirement, never the reverse.

### Typography

Archivo Expanded (`wdth` 125) for display, Inter for everything else, both self-hosted via
`next/font`. Lowercase is applied through the `.lowercase-chrome` class and covers site chrome
only — the wordmark, navigation, and headings the code controls. **Artwork titles render
exactly as the artist entered them in Sanity.**

The first letter of the artist's name sits on a square blue badge, echoing the business card.
The header writes it as literal markup; the home hero (`HomeHero`), whose name comes from Sanity,
goes through the `InitialBadge` component. Both share the `.initial-badge` rule.

The name appears once per screen. The hero heading carries `data-site-wordmark`, and a CSS rule in
`_header.scss` hides the header's own wordmark on any page containing that attribute. The wordmark
stays in layout (`visibility: hidden`, not `display: none`) so the nav row, and the rule beneath it,
sit at the same height on every page. Every other page shows the full wordmark as plain text; the
nav's Home link is the way back. The header never checks the route; it only reacts to the page's markup.

### Navigation

The section links live in `SiteNavigation`, a client component the header renders next to the
wordmark. On screens narrower than 384px the four links no longer fit on one line, so instead of
wrapping they fold behind a hamburger toggle (`aria-expanded`, `aria-controls`) and open as a
sheet of paper hung from the toggle, laid over the page rather than pushing the header rule and
content down. The sheet has no outline: it is lifted by the shared `--shadow-sheet` and torn along
the bottom by the shared `--deckle-edge` mask (the shadow sits on a wrapper, since a mask clips
everything its own element paints). Rows are set in the display face, and the sheet drops in over
160ms, or in one frame under `prefers-reduced-motion`. The pressed toggle takes the sheet's surface,
so it reads as a tab on the sheet's corner. The breakpoint is `$menu-breakpoint` in
`_header.scss`, measured with the real fonts: the list needs 349px plus the container's 32px of
padding. The component only reports the open state in markup (`data-open` on the list); whether the
toggle shows, and how the list hides and is laid out, is decided by the stylesheet alone. The menu
closes on choosing a link, on Escape, and on a press anywhere outside it.

## Setup

```bash
npm --prefix web install
npm --prefix studio install
cp web/.env.example web/.env.local   # then fill in the blanks
```

`web/.env.local` is gitignored and holds the only secret in the project,
`SANITY_WRITE_TOKEN`.
Everything else prefixed `NEXT_PUBLIC_` is public by design and ships in the client bundle.

## Datasets

The Sanity project has two datasets, and which one you read is set by
`NEXT_PUBLIC_SANITY_DATASET`:

| Dataset       | Used by                 | Contents                               |
| ------------- | ----------------------- | -------------------------------------- |
| `development` | local development       | seeded sample data from the Met Museum |
| `production`  | Cloudflare Pages builds | the artist's real artwork              |

The seed script refuses to run against `production` — see below.

## Seeding sample data

The gallery's filter and search can't be judged against three hand-entered rows, so
`web/scripts/seed-gallery.ts` pulls public-domain artwork from the Met Museum Open Access API
into the `development` dataset.

First create a write token at [sanity.io/manage](https://www.sanity.io/manage) → project
`nlwxmhc1` → API → Tokens → **Editor**, and put it in `web/.env.local` as
`SANITY_WRITE_TOKEN`.

| Command                      | What it does                                              |
| ---------------------------- | --------------------------------------------------------- |
| `npm run seed -- --limit 25` | Fetch 25 artworks, upload images, create/update documents |
| `npm run seed -- --clear`    | Delete all `artwork` and `tag` documents first, then seed |

The script **hard-refuses** to run when `NEXT_PUBLIC_SANITY_DATASET` is `production`, so a
stray `--clear` cannot destroy real content. Re-running is safe: artwork is matched by
slug and patched rather than duplicated.

### Sample life events

`web/scripts/seed-life-events.ts` writes a fictional set of `lifeEvent` documents (see
[Key dates on the about page](#key-dates-on-the-about-page)) so the timeline can be seen
with every shape it handles: all three date precisions, overlapping multi-year ranges,
years with several events, and events sharing one date. The events are invented and live in
`web/scripts/lifeEventSeed.ts`; they are not the artist's biography.

| Command                                | What it does                                                  |
| -------------------------------------- | ------------------------------------------------------------- |
| `npm run seed:life-events`             | Create or update the sample events, matched by title          |
| `npm run seed:life-events -- --clear`  | Delete every `lifeEvent` document first, then seed            |

Events flagged for a picture borrow an image asset the gallery seed already uploaded, so
run `npm run seed` first if you want the illustrated sheets. The same production guard
applies. If `web/.env.local` points at `production`, run it against the sample dataset
explicitly:

```bash
NEXT_PUBLIC_SANITY_DATASET=development npm run seed:life-events
NEXT_PUBLIC_SANITY_DATASET=development npm run dev   # then open /about
```

## Importing the real artwork

`production` holds the artist's own work, and the Met seeder refuses to touch it. Real
artwork is imported from a hand-edited YAML file by `web/scripts/import-artwork.ts`:

```bash
npm run import:artwork -- --file <artwork.yaml> --images <directory> [--dry-run]
```

The file is a list, one entry per work, whose keys mirror `studio/schemaTypes/artwork.ts`:

```yaml
- title: Beaver Pond
  slug: beaver-pond
  medium: acrylic          # watercolour | acrylic | oil | pastel | drawing
                           # photography | mixed-media | other
  image: beaver-pond.jpg   # filename, resolved against --images
  alt_text: A still pond ringed by black spruce
  description:
  artist_note: >-
    Painted over three mornings from the far shore.
  dimensions:
    width: 183
    height: 126
    unit: cm               # cm or in — record what was measured, never convert
  year_created:
  price:
  is_featured: false
  tags:
    - orientation/landscape
    - subject/lake
```

`title`, `slug`, `medium`, `image`, and `alt_text` are required; a blank one aborts the
run. Blank optionals are omitted rather than written as null, so an empty field in the
file never overwrites something an editor filled in through the Studio.

### Works that have no photograph yet

Set `has_image: false` on a work the artist has catalogued but not photographed. The
importer holds those entries back and names them, instead of failing the required-image
check — otherwise a single unphotographed work blocks the whole run. Everything else in
the entry can be filled in ahead of the photograph.

The flag is read as truthy unless it explicitly says otherwise: `false`, `no`, `off`, `n`,
`0`, and an empty string all hold the entry back, in any capitalisation. The string forms
matter because the `yaml` package follows the YAML 1.2 core schema, where `no` and `off`
are plain strings rather than booleans — not what most people writing YAML expect.

An absent or empty flag counts as having an image, so a blank `image` with no flag is
still reported as a missing required field rather than silently skipped. Drop the flag
(or set it to `true`) once the image exists.

### Tags are two levels, written `category/name`

`category/name` becomes a `tag` document with `name: landscape`, `category: orientation`,
and slug `orientation-landscape`. A bare `name` gets no category. The **slug carries the
category** because the gallery filter keys on slug alone (`web/lib/gallery/filterArtworks.ts`) —
without it, `landscape` under two categories would collapse into one checkbox. The
checkbox still shows the bare name, so the compound slug costs nothing in the UI.

Tag names are letters and hyphens only, matching the schema's own validation.

### Why the importer validates before it writes

**`@sanity/client` writes run no Studio validation whatsoever** — not `required`, not the
tag name pattern, and not the slug uniqueness Sanity enforces by default in the Studio
(`defaultIsUnique`, which queries for another document of the same type on that slug).
An import is therefore the one path into the Content Lake with no schema check in front
of it.

So the importer does the checking itself, in two places:

1. **Before any write.** Every entry is validated and every problem reported at once — a
   half-applied import into a dataset holding real artwork is worse than a run that
   refuses to start. Duplicate artwork slugs and colliding tag slugs both abort here.
   `--dry-run` stops after this step and writes nothing.
2. **After the import.** The run finishes by shelling out to
   `npx sanity documents validate --dataset production`, which loads the real Studio
   schema and checks what actually landed. Pass `--skip-validate` to suppress it, and run
   it by hand any time:

   ```bash
   cd studio && npx sanity documents validate --workspace production --dataset production
   ```

Re-running is safe. Artwork is matched by slug and patched; tags are matched by slug and
reused. An image is uploaded only when the document does not already have one, so a
re-run does not orphan an asset. `is_featured` is set on create only — like the seeder,
the import must never reset curation done in the Studio.

## Capping how wide a weak scan is shown

Some scans are lower quality than others, and the detail page stretches every image to
the width of its mount. A low-resolution scan stretched past its own pixels looks worse
than the same scan shown smaller. The Sanity CDN never upscales (`fit=max`), so the
stretching happens in the browser, and the fix is to cap the rendered width.

Each artwork has a **Display max width** field (`displayMaxWidth`, in CSS pixels). The
detail page renders the image no wider than that value and offers the browser no `srcset`
candidate wider than it. When the field is empty the cap falls back to the asset's native
pixel width, so no image is ever shown larger than its source even before an editor
touches it. An editor-set value is also clamped to the native width for the same reason.

Gallery and featured thumbnails honour the same cap, but only for the renditions they
offer: no `srcset` candidate is wider than the resolved cap, while the card itself keeps
the mat's size and shape so the grid never goes ragged. The lightbox honours it too: a
slide is fetched no wider than the cap, and PhotoSwipe never enlarges a slide past its own
pixels, so the cap is the largest a work is ever shown anywhere on the site. When the cap
is empty or equals the native width, the lightbox shows the scan at full size on a desktop,
which is where a weak scan is most visible; lower the cap for those works in the Studio.

The cap is in CSS pixels, so it limits the *physical* size a work is shown at, and a phone
never reaches it: the lightbox fits the image to a 390 to 430 pixel screen whatever the cap
says. The cap only reaches a phone if it drops below the phone's device pixels, about 1300
(screen width times a 3x pixel ratio), because then the phone is sent fewer image pixels
than it can display. Keep the cap at or above 1300 and only the desktop shrinks; the Studio
warns, without blocking, below that.

The field is meant to be tuned by eye, but the native width is a fair first guess, so a
one-off script seeds it from the asset metadata:

```bash
npm run backfill:display-width -- --dry-run   # list what would change
npm run backfill:display-width                # write it
```

Only artworks with an empty `displayMaxWidth` are touched, so re-running never undoes a
value set in the Studio. Works whose asset has no pixel metadata are listed and skipped.
The script needs `SANITY_WRITE_TOKEN` in `web/.env.local`, like the seeder.

## Gallery order, prev/next, and the artwork lightbox

The gallery's display order is decided in exactly one place: the `ARTWORK_ORDER` clause in
`web/lib/sanity/queries.ts`. Every query that walks artwork in display order reuses it, so
changing the sort changes the grid and the lightbox together.

An artwork page offers two ways through the collection, both in gallery order. Arrow
buttons flank the sheet at mid-height and step to the neighbouring artwork *pages*, so the
visitor gets each work's title, placard and artist note along the way; the first work has
no previous button and the last no next. Clicking the painting itself opens it in
[PhotoSwipe](https://photoswipe.com), a fullscreen lightbox with its own arrows, swipe,
pinch-zoom and keyboard handling, for looking at the pictures alone. Both read the same
`ARTWORK_NAVIGATION_QUERY`. The lightbox slides are the whole collection, starting at the
current work, built by
`web/lib/artwork/lightboxSlides.ts` from `ARTWORK_NAVIGATION_QUERY` (slug, title, image,
native pixel size, alt text, display cap). A slide is offered no wider than the same
`displayMaxWidth` cap the page applies, so a weak scan is never blown up past it. Artwork
without an image or a measured size is left out of the slide set.

Selecting tags in the gallery writes them to the URL as `?tags=a,b`, and every card link
carries that query onto the artwork page. There, both the arrow buttons and the lightbox
walk only the artwork that matches those tags, in gallery order, and the buttons forward
the query on each hop. If the visitor closes the lightbox on a different painting,
the page follows them there with the same query, so the placard always describes the
painting on screen and Back returns to where they started. Without the query, the buttons
and the lightbox both walk the full collection. The search box is deliberately not mirrored into the URL.

Without JavaScript the painting is a plain link to its full-size image and the buttons are
plain links to the neighbouring pages. Reading the URL bails a component out of
prerendering, so the page wraps `UrlSyncedArtworkLightbox` and `UrlSyncedArtworkNav` in
`Suspense` with `ArtworkLightbox` and `ArtworkNav` over the full collection as fallbacks;
PhotoSwipe itself is fetched on the first click, never before.

## The contact address is never published

The site has no origin server, so there is nowhere to hide an email address at request
time: whatever the contact section of the home page renders is baked into `out/index.html`
and served to every scraper that asks. So no address is rendered at all. The contact form
carries only a Web3Forms access key (`NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`); Web3Forms resolves
the key to the destination inbox server-side, and the visitor never sees it. A unit test on
the Site Settings schema and an e2e test on the built page both fail if a `mailto:` link or
an email field ever comes back.

## The statement on the home page

Between the "View the full gallery" button and the contact section, the home page sets a
short statement about the work and what the site is for. It is read from Site Settings
(Studio → **Site Settings**) and omitted entirely until a statement has been written, so a
fresh dataset renders the page exactly as before.

| Field                  | What it does                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `statement`            | Three to six sentences of plain paragraphs, set large in the display face. Emphasis is the only mark |
| `statementHeading`     | Optional. Shown above the statement as a lowercase section heading with an ink rule; blank for none  |
| `statementImage`       | Optional second photo of the artist, shown signature-sized on a paper sheet beside the words         |
| `statementAttribution` | Optional. Who the statement is by, signed beneath it. Blank publishes the statement unattributed     |

The section is `web/components/StatementSection.tsx`; its layout lives in
`web/styles/_statement.scss`. The layout treats the words as the subject and the portrait as
an aside, so the portrait never grows past 12rem.

## Key dates on the about page

The about page ends with a timeline of the artist's life, read from `lifeEvent` documents
(Studio → **Life events**). The section is omitted entirely when there are none, so a fresh
dataset renders the page exactly as before.

| Field            | What it does                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `title`          | The event, e.g. "First solo exhibition"                                                                  |
| `date`           | Always a full calendar date; pick any day when only the month or year is known                           |
| `datePrecision`  | How much of the date is shown: `day` → "August 18, 1970", `month` → "August 1970", `year` → "1970"       |
| `endDate`        | Optional. Turns the event into a range at the same precision: "1997–2001", "March–August 2015"           |
| `summary`        | Optional short rich text under the title. Select words in the Studio to hyperlink them                   |
| `image`, `altText` | Optional picture, shown small beside the text. Alt text is required whenever an image is set           |
| `sortOrder`      | Optional. Only orders events that fall on the same date; lower comes first                               |

Events are ordered by `date`, then `sortOrder`, then creation time. Events that share a date
(and end date) share one date cell on the page and stack their sheets beneath it.
`web/lib/timeline/formatEventDate.ts` does the formatting; the design and the two rejected
layouts are in `docs/superpowers/specs/2026-09-17-life-timeline-design.md`.

`summary` was a plain `text` field until 2026-09-19. Events saved before then hold a string
the rich-text editor cannot open; convert them once per dataset with the
`life-event-summary-to-portable-text` migration (dry run first, then `--no-dry-run`):

```bash
cd studio
npx sanity migration run life-event-summary-to-portable-text --project nlwxmhc1 --dataset production
```

Re-running the migration is safe: it only touches summaries that are still strings.

## Commands

Run these from `web/`, or from the repository root via the delegating scripts in the root
`package.json` (`npm run dev`, `npm run build`, `npm test`, `npm run seed`,
`npm run import:artwork`, `npm run studio`, `npm run typegen`).

| Command                 | What it does                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | Next dev server at http://localhost:3000                        |
| `npm run build`         | Static export into `out/`                                       |
| `npm test`              | Vitest unit and component tests, once                           |
| `npm run test:watch`    | Vitest in watch mode                                            |
| `npm run test:coverage` | Vitest with the 80% coverage floor enforced                     |
| `npm run test:e2e`      | Playwright against the built `out/` (run `npm run build` first) |
| `npm run lint`          | ESLint                                                          |
| `npm run format`        | Prettier, writing changes                                       |
| `npm run format:check`  | Prettier, check only                                            |
| `npm run seed -- --limit 25` | Seed the `development` dataset from the Met Museum — see above |
| `npm run import:artwork` | Import real artwork from YAML — see above                      |
| `npm run seed:life-events` | Write the fictional sample life events into the `development` dataset — see above |
| `npm run backfill:display-width` | Seed empty `displayMaxWidth` fields from native pixel width — see above |

The Playwright e2e suite requires `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` to be set to a non-empty value in `web/.env.local` **before** running `npm run build`, because the static export bakes the value in at build time. Any placeholder works locally — the tests intercept Web3Forms requests and do not send them.

The suite runs against whichever dataset the build used. Tests that need a particular artwork or search term read it from the built `out/` directory or from the page itself rather than hardcoding a slug, so neither dataset is required.

### Studio commands (run from `studio/`)

| Command                                                     | What it does                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `npm test`                                                  | Vitest schema tests                                                          |
| `npm run dev`                                               | Sanity Studio at http://localhost:3333                                       |
| `npx sanity documents query '<groq>' --dataset development` | Query content from the terminal                                              |
| `npm run typegen`                                           | Regenerate `web/lib/sanity/sanity.types.ts` from the schema and GROQ queries |
| `npx sanity deploy`                                         | Deploy the Studio to its hosted `*.sanity.studio` URL                        |
| `npx sanity dataset list`                                   | List datasets                                                                |
| `npx sanity migration list`                                 | List content migrations in `studio/migrations/`                              |
| `npx sanity migration run <id> --project <id> --dataset <ds>` | Dry-run a migration; add `--no-dry-run` to apply it                        |

### Viewing your content

The Studio exposes **one workspace per dataset**, so you can switch between them in the UI
rather than editing config:

| Workspace                 | URL            | Contents                  |
| ------------------------- | -------------- | ------------------------- |
| Production                | `/production`  | the artist's real artwork |
| Development (sample data) | `/development` | seeded Met Museum content |

```bash
cd studio && npm run dev     # then pick a workspace at http://localhost:3333
```

The workspace switcher is in the top-left. **If the Studio looks empty, you are almost
certainly in the wrong workspace** — seeded data lives only in `development`.

To read content without opening the Studio at all:

```bash
cd studio
npx sanity documents query '*[_type == "artwork"][0...5]{title, medium}' --dataset development
```

Run `npm run typegen` after **any** schema or GROQ query change. TypeGen only discovers
queries declared with `defineQuery`, so a missing result type usually means a query was
written as a bare template string. Generated result types are named
`<QUERY_CONST>_RESULT`, e.g. `ALL_ARTWORKS_QUERY_RESULT`.

`web/lib/sanity/sanity.types.ts` is generated — never hand-edit it. `studio/` is a separate
npm package and is excluded from the root ESLint and Prettier runs.

### How images are sized

The site is a static export, so Sanity's image CDN does all resizing and cropping through
URL parameters. `web/lib/sanity/imageUrl.ts` wraps `@sanity/image-url`; `SanityImage` turns
that into an `<img>` with a `srcset`.

- **Detail pages** request a width only (`fit=max`), so the whole artwork is shown at its
  own proportions.
- **Gallery and featured thumbnails** pass an `aspectRatio` to `SanityImage`, which adds a
  matching height and `fit=crop`. The ratio is the card mat's `--card-ratio` token, so the
  cropped image fills its mat edge to edge whatever shape the source is. The CDN centres
  the crop on the **hotspot** the editor set in the Studio image field, so if a thumbnail
  cuts off the wrong part of a piece, fix it by moving the hotspot rather than
  re-uploading. `web/lib/artwork/cardAspectRatio.ts` mirrors the token for build-time URL
  generation; a test fails if the two drift apart. Thumbnail renditions are offered at
  roughly 1×, 2× and 3× the `--card-width-max` token, and the `sizes` attribute is that
  token (mirrored by `web/lib/artwork/cardMaxWidth.ts`), so the browser never fetches a
  rendition sized for a wider card than the grid will draw.

### What the coverage floor measures

`npm run test:coverage` enforces 80% across statements, branches, functions, and lines.
Three things are excluded from the measurement (paths below are relative to `web/`),
because Vitest cannot see them and counting them would make the gate unreachable rather
than strict:

- `web/lib/sanity/sanity.types.ts` — generated
- `app/**/page.tsx` and `app/layout.tsx` — server components that compose already-tested
  pieces around a build-time fetch; verified by the Playwright suite
- `scripts/seed-gallery.ts` — dev-only CLI; its pure logic lives in `scripts/metMuseum.ts`
  and is fully covered there, leaving only network and upload plumbing that a mock could
  not meaningfully test
- `scripts/seed-life-events.ts` — the same shape; its sample data and document mapping are
  covered in `scripts/lifeEventSeed.ts`

Everything else counts. Do not widen this list to make a failing run pass.

## Troubleshooting

### Studio: "Failed to fetch dynamically imported module"

```text
Failed to fetch dynamically imported module:
http://localhost:3333/node_modules/.sanity/vite/deps/refractor-<hash>.js?v=<id>
```

The Studio runs on Vite, which pre-bundles dependencies into
`studio/node_modules/.sanity/vite/deps/` under content-hashed filenames. This error means
something is serving HTML that references a chunk hash no longer on disk. It is **not** a
missing dependency.

Two causes, in order of likelihood:

**1. More than one dev server is running.** All dev servers share that one cache
directory. Starting a second one re-optimizes the cache and rewrites the hashes out from
under the first, which then serves dead references. Reloading the browser cannot fix
this — the stale mapping is server-side. Check first:

```bash
ss -ltnp | grep -E ':333[0-9]'          # what is listening
ps -eo pid,etime,cmd | grep '[s]anity dev'
```

Kill every stray server, then verify the port is actually free — killing an `npx` wrapper
does **not** stop the underlying node process:

```bash
kill -TERM <pid> && sleep 2 && ss -ltn | grep -E ':333[0-9]' || echo "port free"
```

**2. A browser tab predates a config change.** Editing `sanity.config.ts` makes Vite
re-optimize and issue new hashes; a tab loaded before that still requests the old ones.
Lazily-imported chunks such as `refractor` (used by Vision for syntax highlighting) fail
only when something finally requests them, so the error can appear well after the change.
Hard-reload the tab (`Ctrl+Shift+R`).

If neither clears it, stop every server, rebuild the cache, and start exactly one:

```bash
cd studio && rm -rf node_modules/.sanity && npm run dev
```

To confirm the cache is healthy rather than guessing:

```bash
ls studio/node_modules/.sanity/vite/deps/ | wc -l     # expect several hundred
find studio/node_modules/.sanity/vite/deps -size 0    # expect no output
```

### Studio: "Invalid property value ... must be of type object"

Shown on a field after its schema type changed, with the old value quoted underneath.
Sanity stores **drafts as separate documents**, so anything you had open in the Studio
keeps the old shape even after a script migrates the published documents.

Finding them is the trap: a client with no token reads the `published` perspective and
**silently omits drafts**, so a query will report zero affected documents while the Studio
is visibly showing the error. Always investigate with a token and `perspective: 'raw'`:

```ts
createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
  perspective: "raw", // without this, drafts are invisible
});
```

Then patch the stale documents in place rather than deleting them — a draft can hold
unpublished edits (a flag you toggled, a field you filled in) that deleting would discard.
Migrate the changed field only, leave the rest untouched, and publish from the Studio
afterwards.

**Do not use the "Reset value" button the Studio offers** unless you want that field
cleared: it discards the old value instead of converting it.

### Studio: "Duplicate instances of context ... incompatible versions"

```text
Duplicate instances of context "sanity/_singletons/context/active-workspace-matcher"
with incompatible versions detected
```

**This is prevented by the repository layout and should not occur.** If it does, something
has reintroduced a shared `node_modules` above `web/` and `studio/`.

`sanity` is a peer dependency of `next-sanity`, so the site installs its own copy. The
Studio installs another. They only collide if one can _resolve_ the other's — which Node
only does by walking **up** the directory tree. Keeping `web/` and `studio/` as siblings,
with **no dependencies at the repository root**, makes that walk-up impossible.

Diagnose by checking what the Studio actually resolves:

```bash
cd studio && node -e "console.log(require.resolve('sanity/package.json'))"
```

It must print a path inside `studio/node_modules`. If it prints anything else, find and
remove the offending `node_modules`:

```bash
ls -d node_modules        # at the repository root: must NOT exist
```

Never fix this by adding a version `overrides` entry at the root — that reintroduces the
shared tree this layout exists to avoid.

## Notes on tooling choices

`@vitejs/plugin-react` is deliberately **not** installed. It exists to provide Fast Refresh
for a Vite dev server, which this project never runs, and its Babel 8 dependency chain
conflicts with the Babel 7 that `@sanity/codegen` (via `next-sanity`) requires. Vitest 4
transforms JSX through oxc with no plugin needed.
