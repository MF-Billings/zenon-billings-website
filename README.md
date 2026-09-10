# Zenon Billings — Artist Portfolio

A statically-exported Next.js portfolio backed by Sanity, hosted on Cloudflare Pages.
There is no origin server: every page is built to static HTML at deploy time, and the
only runtime network call is the contact form posting to a third-party endpoint.

- **Content:** [Sanity](https://sanity.io) project `nlwxmhc1` (no application database)
- **Rendering:** Next.js App Router in `output: 'export'` mode
- **Styling:** [Pico.css](https://picocss.com) via SCSS
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
   background plane — paper, washes, drawn rules. No handwriting faces. No rotated text.
2. **At most one wash bloom visible per viewport.** They accumulate faster than they should.

The failure mode is scrapbook, and it arrives by accumulation. If the design starts drifting,
check these two rules first.

### Where to change what

| Change                                        | File                          |
| --------------------------------------------- | ----------------------------- |
| A colour, spacing value, or the mat ratio[^1] | `web/styles/_tokens.scss`     |
| Type scale or the studio label                | `web/styles/_typography.scss` |
| Paper texture, blooms, ink rules, deckle edge | `web/styles/_materials.scss`  |
| Anything specific to one page                 | `web/styles/_<area>.scss`     |

[^1]: Also update `CARD_ASPECT_RATIO` in `web/lib/artwork/cardAspectRatio.ts`; the CDN crops
    thumbnails to it. A unit test fails if it no longer matches the token.

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
That is the only secret in the project; never commit it.

| Command                      | What it does                                              |
| ---------------------------- | --------------------------------------------------------- |
| `npm run seed -- --limit 25` | Fetch 25 artworks, upload images, create/update documents |
| `npm run seed -- --clear`    | Delete all `artwork` and `tag` documents first, then seed |

The script **hard-refuses** to run when `NEXT_PUBLIC_SANITY_DATASET` is `production`, so a
stray `--clear` cannot destroy real content. Re-running is safe: artwork is matched by
slug and patched rather than duplicated.

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

The field is meant to be tuned by eye, but the native width is a fair first guess, so a
one-off script seeds it from the asset metadata:

```bash
npm run backfill:display-width -- --dry-run   # list what would change
npm run backfill:display-width                # write it
```

Only artworks with an empty `displayMaxWidth` are touched, so re-running never undoes a
value set in the Studio. Works whose asset has no pixel metadata are listed and skipped.
The script needs `SANITY_WRITE_TOKEN` in `web/.env.local`, like the seeder.

## The published contact address

The site has no origin server, so there is nowhere to hide an email address at request
time: whatever the contact page renders is baked into `out/contact/index.html` and served
to every scraper that asks. The address is therefore treated as public by design.

Two separate channels reach the artist, and neither one publishes a personal inbox:

| Channel          | What the page contains                                      | What the visitor never sees                                            |
| ---------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| The contact form | A Web3Forms access key (`NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`) | The destination address — Web3Forms resolves the key to it server-side |
| The mailto link  | `siteSettings.publicContactAlias`                           | The inbox the alias forwards to                                        |

`publicContactAlias` must hold a **forwarding alias, never a personal address**. The site
is already on Cloudflare, so the cheapest source of one is Cloudflare Email Routing:

1. Cloudflare dashboard → the site's domain → **Email** → **Email Routing**
2. Add a destination address (the artist's real inbox) and verify it
3. Create a custom address — `hello@<domain>` — forwarding to that destination
4. Put the _alias_ into Site Settings → Public contact alias in the Studio

The point of the alias is that it is disposable. If it starts attracting spam, delete the
routing rule, create a new alias, update the field, and redeploy; the real inbox is never
exposed and never has to change. That property is lost the moment a personal address goes
into the field, which is why the field is named for what it is rather than "contact email".

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
| `npm run import:artwork` | Import real artwork from YAML — see above                      |
| `npm run backfill:display-width` | Seed empty `displayMaxWidth` fields from native pixel width — see above |

The Playwright e2e suite requires `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` to be set to a non-empty value in `web/.env.local` **before** running `npm run build`, because the static export bakes the value in at build time. Any placeholder works locally — the tests intercept Web3Forms requests and do not send them.

### Studio commands (run from `studio/`)

| Command                                                     | What it does                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `npm test`                                                  | Vitest schema tests                                                          |
| `npm run dev`                                               | Sanity Studio at http://localhost:3333                                       |
| `npx sanity documents query '<groq>' --dataset development` | Query content from the terminal                                              |
| `npm run typegen`                                           | Regenerate `web/lib/sanity/sanity.types.ts` from the schema and GROQ queries |
| `npx sanity deploy`                                         | Deploy the Studio to its hosted `*.sanity.studio` URL                        |
| `npx sanity dataset list`                                   | List datasets                                                                |

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
  generation; a test fails if the two drift apart.

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

### Studio: "Duplicate instances of context ... incompatible versions"

```text
Duplicate instances of context "sanity/_singletons/context/active-workspace-matcher"
with incompatible versions detected: Expected 6.10.1 but got 6.11.0
```

Two different versions of the `sanity` package exist in the repo and the Studio loaded
both, so React sees two copies of the same context singleton.

**Why it happens here.** `sanity` is a _peer dependency_ of `next-sanity`
(`^5.29.0 || ^6.0.0`), which npm installs automatically — so a copy lands in the **root**
`node_modules` for the site, while `studio/` installs its own. Because `studio/` sits
inside the app's directory tree, Node resolution walks up and can reach the root copy.
When the two versions differ, this error appears.

**The fix in place:** the root `package.json` has an `overrides` entry pinning `sanity` to
the version the Studio uses, so both trees resolve identically.

```json
"overrides": { "sanity": "6.11.0" }
```

**This must stay in lockstep.** When you upgrade `sanity` in `studio/package.json`, update
the root override to match, then:

```bash
npm install
rm -rf studio/node_modules/.sanity
```

Verify both trees agree:

```bash
npm ls sanity            # root tree
cd studio && npm ls sanity
```

The underlying cause is structural: Sanity's recommended monorepo puts the Studio and the
web app as _siblings_ under a root with no `node_modules`, which removes the walk-up
entirely. This project has the app at the repository root instead, because the Next.js app
existed first. The override handles it; the sibling layout would prevent it. See
`docs/sanity_setup_deviations.md`.

## Notes on tooling choices

`@vitejs/plugin-react` is deliberately **not** installed. It exists to provide Fast Refresh
for a Vite dev server, which this project never runs, and its Babel 8 dependency chain
conflicts with the Babel 7 that `@sanity/codegen` (via `next-sanity`) requires. Vitest 4
transforms JSX through oxc with no plugin needed.
