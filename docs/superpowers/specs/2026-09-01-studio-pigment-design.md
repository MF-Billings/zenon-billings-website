# Studio / Pigment — Visual Design Spec

**Date:** 2026-09-01
**Status:** Approved for planning
**Scope:** `web/` only. No Sanity schema changes, no query changes, no new dependencies.

## Goal

Replace the site's unstyled Pico defaults with a distinctive visual identity derived from
the artist's own medium. Today `styles/style.scss` is ~50 lines of layout utilities and no
visual identity; the site is indistinguishable from an unstyled HTML document.

## The organizing idea

**The site is made of the same materials as the work.** Every decorative element must trace
back to watercolour as a physical medium — paper, water, pigment. That constraint is what
separates this from arbitrary decoration, and it is the reason the design cannot be lifted
onto another artist's site.

Two rules follow from it, and they are constraints rather than suggestions:

1. **Discipline in the type, handmade in the surfaces.** Personality lives in the background
   plane — paper, washes, drawn rules. The content plane, where the artwork and text live,
   stays quiet. No handwriting faces. No rotated text. Ever.
2. **At most one wash bloom visible per viewport.** Blooms accumulate faster than they
   should; this is the ceiling.

The named failure mode is **scrapbook**, and it arrives by accumulation rather than by any
single decision. If the design starts drifting, check these two rules first.

## Non-goals

- Dark mode. Watercolour is a light-ground medium; a dark variant needs an entirely separate
  material story (pigment on toned paper) to avoid looking broken. Pico's automatic
  `prefers-color-scheme` dark theme is explicitly disabled.
- Page transitions, scroll-triggered reveals, filter-change animations. Motion is the easiest
  thing to add once the static design settles, and this site currently ships almost no
  client-side JavaScript. Keep it that way. The one exception is the CSS hover transition on
  artwork cards, which needs no JavaScript and is specified below.
- Any change to Sanity schemas, GROQ queries, or the content model.

## Decisions

| Decision | Choice | Rejected alternatives |
|---|---|---|
| Direction | Studio / pigment | Dark atelier (flatters photography, fights light-ground watercolour, costs bio readability); museum editorial (portable to any artist, risks reading bland again); brutalist (competes with the artwork) |
| Heading face | Archivo Expanded, `wdth: 125`, lowercase | Syne (only wide at bold+, personality competes with textures); Bricolage Grotesque (less inherently wide); Unbounded (display-only, unusable below ~24px) |
| Body face | Inter | — |
| Lowercase scope | Site chrome only | Everything (silently rewrites artist's own capitalisation); everything-with-schema-override (a schema field, a Studio change, and a conditional in two components — too much machinery for a five-page site) |
| Styling architecture | Keep Pico, trim it | Additive-only (specificity fights on `article`/`nav`/`header`, ships overridden CSS); remove Pico (rebuild form controls and focus states by hand; contradicts AGENTS.md §3) |
| Grid aspect ratios | Uniform 4:5 mat, `object-fit: contain` | Uniform crop (misrepresents the work); masonry columns (reading order runs down columns; uneven bottoms look accidental at low artwork counts); justified rows (math would have to run client-side on every gallery filter change) |
| Scope | Full art direction — all five pages recomposed | Skin-only (blooms and dividers have nothing to attach to); hero-and-detail-only (leaves the gallery, the most-visited page, untransformed) |

---

## Material system

Four materials, each defined once in `_materials.scss`, used everywhere.

### Paper ground

Background is `--paper-cold-press` with a real tooth: a tiled SVG `feTurbulence` noise inlined
as a data URI on a fixed `body::before`, low opacity, `mix-blend-mode: multiply`,
`pointer-events: none`. Roughly 400 bytes, one composited layer, no network request. This
single rule does more work than anything else in the spec — it stops the page reading as
`#fff`.

Content sits on `.paper-sheet`: a slightly lighter surface with a soft cast shadow, creating
two distinct planes rather than one flat surface.

### Wash blooms

An irregular radial pigment field. A radial gradient pushed through `feTurbulence` +
`feDisplacementMap` so the boundary is ragged rather than a clean circle, with a slightly
darker stop at the edge to mimic **granulation** — the ring real pigment leaves as it dries.

- Opacity 10–18%.
- Static. Never animated, so the filter rasterises once.
- Rendered on a small `viewBox` and scaled up; SVG filters over large areas are expensive on
  low-end phones.
- Never inside a scrolling or animated element.
- `aria-hidden`, `pointer-events: none`.

### Ink rules

Section dividers are inline SVG paths with natural stroke-weight variation and a barely
perceptible wobble, stretched via `preserveAspectRatio="none"`. These replace every
`border-top: 1px solid` on the site.

### Deckle edge

Where one band meets another, a `mask-image` carrying a torn-paper edge, so bands read as
overlapping sheets rather than stacked `div`s.

---

## Colour

Pigments are named for what they are, not for where they are used. The medium mapping is the
reason the token layer exists: it is one fact consumed by filter chips, artwork cards, and
detail pages.

```scss
:root {
  --paper-cold-press: #f7f3ec;

  --pigment-payne-grey:   #3d4f5c;
  --pigment-burnt-sienna: #9c5433;
  --pigment-indigo:       #2e3a5c;
  --pigment-raw-umber:    #6b5b45;

  --ink-primary: #2a3138;
  --ink-muted:   #6e6a63;

  --medium-watercolour: var(--pigment-indigo);
  --medium-drawing:     var(--pigment-payne-grey);
  --medium-photography: var(--pigment-burnt-sienna);
  --medium-other:       var(--pigment-raw-umber);

  --space-band:  clamp(3rem, 8vw, 6rem);   /* between major page bands */
  --space-sheet: clamp(1.5rem, 3vw, 2.5rem); /* padding inside a paper sheet */
  --mat-inset:   clamp(0.75rem, 2vw, 1.25rem); /* mat margin around artwork */
  --edge-tilt:   0.4deg;
  --card-ratio:  4 / 5;
}
```

Pigment values are the starting palette and may be tuned during implementation, subject to
the contrast floor below.

### Contrast

WCAG AA requires 4.5:1 for body text and 3:1 for large display text.

The table below was originally computed against flat `--paper-cold-press` (relative luminance
0.900). That ground never actually renders: `body::before` lays a fixed, tiled `feTurbulence`
grain layer at 50% opacity in `mix-blend-mode: multiply` over the paper, and text outside a
`.paper-sheet` sits on that composite, not on the flat token value. The figures below are
**measured against the rendered, composited ground** (by screenshotting a blank patch of body
background and averaging its pixels), not calculated from the tokens — the calculated numbers
were what shipped without this check, and `--ink-muted` was measuring above floor on paper
while landing close to it on the real page.

| Token | Ratio on paper (calculated) | Ratio on rendered ground (measured) | Verdict |
|---|---|---|---|
| `--ink-primary` | 11.9:1 | 11.29:1 | AAA |
| `--pigment-indigo` | 10.1:1 | 9.60:1 | AAA |
| `--pigment-payne-grey` | 7.7:1 | 7.28:1 | AAA |
| `--pigment-raw-umber` | 5.9:1 | 5.61:1 | AA |
| `--pigment-burnt-sienna` | 5.1:1 | 4.83:1 | AA |
| `--ink-muted` | 4.9:1 | 4.61:1 | AA (covers 0.75rem studio labels — clears 4.5:1, ~2% headroom) |

Measured by loading the built static export in Playwright, screenshotting a blank stretch of
`body` background away from any glyphs, averaging its pixels to `rgb(241, 237, 230)`, and
computing the ratio against that instead of the token's flat value. `--ink-muted` clears the
4.5:1 floor against the real ground, but narrowly enough that it is worth re-checking after any
future change to the grain's opacity, blend mode, or the paper token itself. **The palette
bends to the contrast requirement, never the reverse.** Text never sits directly on a bloom
without a solid backing.

---

## Typography

Both families self-hosted through `next/font`, subset to latin, with its automatic fallback
metric matching so there is no layout shift. No runtime font requests.

| Role | Face | Size |
|---|---|---|
| Wordmark / hero | Archivo Expanded 600 | `clamp(2.4rem, 7.2vw, 5.6rem)`, leading 0.95, tracking 0.15em |
| Page title | Archivo Expanded 600 | `clamp(2.25rem, 5vw, 3.5rem)` |
| Artwork title | Archivo Expanded 600 | page title scale below 900px; fixed 2.9rem from 900px up, where it sits as a placard beside the work |
| Section heading | Archivo Expanded 500 | `clamp(1.5rem, 3vw, 2rem)` |
| Card title | Archivo Expanded 500, `wdth: 110` | 1.125rem |
| Body | Inter 400 | 1.0625rem / 1.7, measure capped at 68ch |
| Studio label | Inter 500 | 0.75rem, tracking 0.08em, `--ink-muted` |

Fluid sizing via `clamp()` throughout — no breakpoint jumps, except the artwork title above.

### Lowercase

`text-transform: lowercase` applies to **site chrome only**: the wordmark, navigation, and
section headings the code controls (`featured work`, `gallery`, `about`, `contact`).

Artwork titles render exactly as entered in Sanity. Forcing lowercase would rewrite content
the artist typed, and titles containing proper nouns or roman numerals would read as a
mistake rather than a choice.

### Studio label

The recurring detail that ties the site together. Artwork metadata renders identically
everywhere as `2024 · watercolour · 30 × 40 cm`, small and tracked out, with the medium in
its own pigment colour. It appears under cards, on detail pages, and in the gallery.

---

## Components

Deliberately few. Anything that is only a surface treatment is a CSS class — wrapping a class
in a React component is machinery without payoff.

| Name | Kind | Rationale |
|---|---|---|
| `.paper-sheet`, `.paper-sheet--deckle` | CSS class | Pure surface. No props, no logic. |
| `PaperDefs` | Component, rendered once in `app/layout.tsx` | Holds the SVG `<filter>` definitions with stable ids. Rendering filters per bloom would duplicate identical defs a dozen times. |
| `WashBloom` | Component | Inline SVG plus a `pigment` prop. `aria-hidden`. |
| `InkRule` | Component | Inline SVG divider. `aria-hidden`. |
| `StudioLabel` | Component | Composes year, medium, and dimensions via `formatDimensions`. The real DRY win: that string is currently built two different ways in two places. |
| `MediumChip` | Component | Medium name in its own pigment. |

`medium` and `dimensions` are already present in `ARTWORK_FIELDS`, so `StudioLabel` requires
no query changes.

### Modified

`ArtworkCard`, `ArtworkGrid`, `GalleryBrowser`, `SiteHeader`, `SiteFooter`, and all five
pages change structurally.

---

## Page compositions

**Header.** Wordmark `zenon billings` left in Archivo Expanded, navigation right as studio
labels, `InkRule` beneath. Not sticky — on a site this short it costs vertical space and buys
nothing.

**Home.** Asymmetric hero: wordmark at `clamp(2.4rem, 7.2vw, 5.6rem)` on the left, tagline below in
Inter, a `WashBloom` bleeding in from the top-right behind it and past the container edge. The
band closes on a deckle edge. Then `featured work` as a section heading with an ink rule, the
three-up grid, and the existing `role="button"` gallery link restyled as a pigment-filled
button.

**Gallery.** The largest transformation, and the page that most needs it.

- Search input loses its box and becomes a single ruled line.
- Tag checkboxes become pigment chips. The native `<input type="checkbox">` stays in the DOM,
  visually hidden, with the `<label>` styled as the chip. Keyboard, focus, and screen reader
  behaviour are untouched. Checked state is pure CSS via `:has()`.
- Result count becomes a studio label.
- The grid staggers: cards take a small vertical offset on an `nth-child` cycle so rows stop
  reading as a rigid table. Flattens to a plain grid below the mobile breakpoint.

**Artwork card.** A mounted sheet: the image contained inside a 4:5 paper mat with a mat
border, a fractional-degree tilt cycling on `nth-child(4n)`, soft cast shadow. Hover lifts and
straightens it to 0°. Title, then studio label beneath.

**Artwork detail.** Two columns. The image, mounted and matted, in the wide column with a
`WashBloom` in that piece's medium pigment behind it. The narrow column is the placard: title,
studio label, description at 68ch, medium chip, tags. The placard is `position: sticky` on
desktop so metadata stays with the reader while a tall painting scrolls — CSS only, no JS.
Single column on mobile. This replaces the current `<dl>`, the least designed element on the
site.

**About.** A studio spread. Portrait mounted on paper with a tilt, bio in a measured column
with a drop cap set in Archivo. No tape graphics — that is the scrapbook line.

**Contact.** Form on a paper sheet, inputs as ruled lines matching the gallery search, submit
as a pigment button, alias link with a brush-stroke underline.

**Footer.** Ink rule above, studio label. No bloom: a footer bloom was specified here, but on
the artwork detail page the placard already spends this viewport's one-bloom allowance on the
plate bloom behind the image, and adding a second in the footer would break the "at most one
wash bloom visible per viewport" rule on that page. It was dropped site-wide, not just there,
so the footer treats every page the same way.

---

## Aspect-ratio strategy

Artwork images vary between portrait, landscape, and square. The current grid uses
`width: 100%; height: auto`, so cards differ in height, rows align to the tallest item, and
the bottoms come out ragged. Invisible at four artworks; conspicuous at twenty.

**Every card is a uniform 4:5 mat.** The image is *contained* whole inside it — never
cropped — and the leftover space becomes the mat margin. On most sites that space reads as an
awkward gap; here it reads as matting, because a mat board is what physical framed art sits
in. 4:5 is deliberately taller than square: portrait watercolours nearly fill it, landscapes
get generous mat above and below.

This is the only option immune to whatever the artist uploads next, and it needs no query
changes and no JavaScript. The cost is that a strongly panoramic piece renders fairly small
inside its frame, reading as a deliberately matted small work.

Visual variety comes from the tilt and the stagger, not from card dimensions.

---

## Styling architecture

Pico is kept for the reset, base element defaults, form control styling, and keyboard focus
outlines — that last group is the part currently earning its keep, covering the contact form
and the gallery filters.

- `_tokens.scss` defines the pigment palette and maps it onto Pico's `--pico-*` custom
  properties, so Pico's own components inherit the identity automatically. This mapping is the
  single seam with Pico; when Pico changes variable names, there is exactly one file to fix.
- Pico modules fully replaced by our own layer (card, nav) are disabled at import, so we do
  not ship CSS we then override. **The exact settings API must be confirmed against the
  installed Pico v2 version before implementation** — `node_modules` is not currently
  installed in this worktree.
- Pico's automatic dark theme is disabled.
- Pico's source is never edited (AGENTS.md §3).

### File structure

`styles/style.scss` becomes an entry point over partials. A single thousand-line stylesheet
would violate the modularity rule in AGENTS.md §5.

```text
web/styles/
  style.scss          entry: @use pico (trimmed) + partials
  _tokens.scss        pigments, paper, spacing, medium mapping, --pico-* bridge
  _typography.scss    font faces, fluid scale, studio label
  _materials.scss     paper grain, blooms, ink rules, deckle, sheets
  _header.scss
  _home.scss
  _gallery.scss
  _artwork.scss
  _about.scss
  _contact.scss
  _forms.scss
```

### No inline styles

The card tilt uses `:nth-child()` cycling rather than a per-card inline style. Deterministic,
stable across renders, and compliant with AGENTS.md §3.

---

## Testing

TDD is mandatory (AGENTS.md §1). Visual design is not directly testable, and pretending
otherwise produces brittle tests asserting on `box-shadow` strings. The testable seams:

### New components, written test-first

- **`StudioLabel`** — the strongest TDD candidate. Pure formatting logic whose entire job is
  degrading gracefully: year only; medium only; dimensions with width but no height; all
  three; none.
- **`MediumChip`** — maps medium to pigment; must handle `other` and unrecognised values
  without falling through to an undefined colour.
- **`WashBloom`**, **`InkRule`** — render, and are `aria-hidden`.
- **`PaperDefs`** — emits stable filter ids.

### Regression guard

Converting gallery checkboxes to visually-hidden inputs with styled labels is exactly the
change that silently destroys keyboard and screen reader access. The existing `GalleryBrowser`
test must keep querying via `getByRole('checkbox')` and toggling through the label. **This is
the single most valuable test in the work.**

### Existing tests

`ArtworkCard`, `ArtworkGrid`, `SiteHeader`, `SiteFooter`, and `GalleryBrowser` tests change
alongside their components, red first. Note that the current `ArtworkCard` test fixture sets
`dimensions` to the string `'30 x 40 cm'`, which does not match the schema's object shape; it
is cast through `unknown`. `StudioLabel` needs the real `{ width, height, unit }` object, so
that fixture must be corrected.

Coverage floor stays at 80%, with the existing exclusion list unchanged.

### End-to-end

`tests/e2e/` does not currently exist — `playwright.config.ts` is configured but no specs are
written. This work adds the first: **no horizontal overflow at 320, 768, and 1280.** Blooms
deliberately bleed past their containers, which is precisely what causes an accidental
horizontal scrollbar on mobile. Cheap test, likely regression.

### Explicitly not tested

Colours, shadows, spacing values, tilt angles. Asserting on those locks the design in cement
and tells us nothing.

---

## Accessibility

- Every pigment contrast-checked against the paper ground before shipping (table above).
- All decorative SVG is `aria-hidden` and `pointer-events: none`.
- Pico's focus ring is restyled in pigment, **never removed**. Chips need
  `:has(:focus-visible)` on the label so the hidden input's focus is visible on the element
  the user can actually see.
- `prefers-reduced-motion` disables the card lift and straighten.
- `prefers-contrast: more` drops the grain and blooms and flattens to solid paper.

## Performance

- **No new dependencies.** No client-side JavaScript added: sticky placard is CSS, chips are
  CSS `:has()`, blooms are static SVG.
- Two variable fonts, latin subset, self-hosted via `next/font`.
- Paper grain: one tiled data URI, ~400 bytes, single fixed layer.
- Blooms capped in size, small `viewBox` scaled up, never inside scrolling or animated
  elements.
- Trimming Pico's card and nav modules does not offset the CSS added. Measured against the
  built static export, this styling layer is +7.7 KB raw / +2.1 KB gzipped over the trimmed
  Pico baseline.
- `:has()` is baseline in current browsers, but the failure mode matters: without it, chips
  render with no visible checked state. An `@supports not (selector(:has(*)))` block keeps the
  native checkboxes visible as a fallback.

## Documentation

Both update as part of the work, per AGENTS.md §6:

- **AGENTS.md §3** currently states all customisations live in `styles/style.scss`. Update to
  describe the partials structure and the trimmed Pico import.
- **README.md** gains a design system section: the pigment palette, the medium mapping, the
  two constraint rules, and where to change what.

## Prerequisite

`npm install` in `web/` — dependencies are not installed in this worktree, and Pico's settings
API must be confirmed against the installed version before the styling architecture is built.
