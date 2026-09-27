# Brushstrokes on the home hero

**Date:** 2026-09-24
**Status:** Implemented on `worktree-hero-brushstroke` after three independent critiques;
awaiting owner review. Values that changed during implementation are marked "shipped".
**How to adjust it:** `docs/hero-brushstrokes.md`. This document is the record of why.
**Supersedes:** the treeline attempts parked on the local branch `treeline-hero`, and, for
brushstrokes only, the "text never sits directly on a bloom" rule of the studio-pigment spec.

## Intent

The artist painted two watercolour brushstrokes for the home page: a pine tree and a strip
of water. The owner composed them in GIMP over screenshots of the live site, one for a phone
(375 x 668) and one for a wide desktop (1878 x 1269). The site should reproduce those two
compositions and hold up on every width in between and beyond, without the two failures of
the earlier attempts:

1. the wordmark ran over the trees on wide screens, and
2. the trees landed in a different spot on every phone, because they were positioned as a
   percentage of the hero's height, which differs per device.

Success looks like:

- On a 375-wide phone and on a 1878-wide desktop the page reads as the mockups.
- On every width from 320 to 1920, including landscape phones and the widths between Pico's
  container steps, the same rules produce the same design, with no horizontal scrollbar.
- The owner can move or resize either brushstroke by editing one value in one place and
  seeing the result under Turbopack hot reload.
- Every piece of text that can sit over a brushstroke is measured to be legible.

### What the mockups specify

Measured by diffing each mockup against the plain screenshot it was painted over, then
template-matching the exported assets into the difference (RMS fit 14.8 for the phone tree,
6.4 for the water, against 31.9 and 16.7 for no match).

| Brushstroke | Phone (375 wide, root 16px, container = viewport) | Desktop (1878 wide, root 21px, container 1450 at x 214..1664) |
| --- | --- | --- |
| Tree | `tree` at 1x (197 x 281): 52.5% of the viewport (replaced 2026-09-27 by the owner's 386 x 348 export, a pine at the right with haze running left, shown at its own pixel size and faded out under the text column; see D6). Right edge flush with the viewport edge. Tip 19 px above the header rule's box (15 px above its ink). Bottom at y 350, about 30 px above the "featured work" rule. | `trees` (565 x 462, two pines; the owner's first export, cut flat across the top, which the shipped placement hides above the viewport edge; a 585 x 588 and a 534 x 541 export with the spire intact were tried on 2026-09-26 and set aside because their lower haze sat in the water). The owner's reference screenshot of 2026-09-26 puts it at the viewport top behind the nav row with its right side running off the screen edge. |
| Water | absent | `water` at 1x (1677 x 319): 89% of the viewport. Left edge at x 161 (8.5% of the viewport, 54 px outside the container). Top 16 px below the tagline's box. Runs behind the "featured work" heading and rule, ending just above the cards. |
| Text over brushstrokes | The tagline crosses 71% of the tree's width, over dense branches. | "featured work" sits on the water. "contact" sits on the tree tip. The wordmark's box overlaps the trees' box but its ink touches only faint haze. |

Two of those overlaps cannot meet the site's contrast rule and this spec changes them; see D6.

## Decisions

### D1. Two brushstrokes, one file each, art-directed by breakpoint, no composites

Three static files in `web/public/brushstrokes/`, named for what they depict:

| File | Pixels | Bytes | Shown |
| --- | --- | --- | --- |
| `tree.webp` | 386 x 348 | 52 KB | below the wide breakpoint (the owner's 2026-09-27 export, dropped in as is; the 197 x 281 file until then) |
| `trees.webp` | 565 x 462 | 108 KB | from the wide breakpoint |
| `water.webp` | 1677 x 319 | 213 KB | from the wide breakpoint |

They are the `_q80` lossy WebP copies from the owner's assets folder (alpha channel
bit-identical to the lossless masters, colour at quality 80, about 36 dB PSNR). The masters,
the export command and the upgrade notes stay in that folder, outside the repository; the
export command is also documented in the README.

The tree is one `<picture>`: `<source media="(min-width: 48em)" srcset="/brushstrokes/trees.webp" width="565" height="462">`
and the `<img src="/brushstrokes/tree.webp" width="197" height="281" alt="" decoding="async">`
fallback. A phone never downloads the wide file and vice versa. `width`/`height` on the
`<source>` give the wide file its own aspect ratio on first load; without them the box
takes the phone file's ratio until the bytes arrive (measured). On a live resize across
the breakpoint (a tablet rotating) the box keeps the old file's ratio until the new file
arrives, and the old file paints stretched meanwhile; that is inherent to `<picture>` and
cosmetic, since no text can land on it.

The water is a plain `<img alt="" decoding="async" loading="lazy">` hidden below the
breakpoint with `display: none`. `loading="lazy"` matters: React 19 otherwise emits a
`<link rel="preload">` for a plain `<img>` with no media condition, so every phone would
download 213 KB it never shows; a lazy image with no box is never fetched (measured: 0
requests at 375, 1 at 1280).

No `fetchpriority`. Nothing else on the site uses it and a decoration should not outrank
the featured thumbnails. The tree is early in the document and loads eagerly by default.
Accepted cost: on wide screens the water is the largest contentful element and loads
lazily, so Lighthouse reports "LCP image was lazily loaded". Readers see the wordmark
first either way. If the metric matters, the fix is a `<picture>` with a media-gated
`<source>` and a transparent fallback, which React 19 does not preload and phones never
fetch.

The `@next/next/no-img-element` rule already exempts an `<img>` inside `<picture>`, so only
the water needs a disable comment, with the reason: a fixed static file with no renditions.

Rejected: one composite file per mockup. Every nudge would be a re-export, and the relative
placement of tree and water would be frozen into pixels.

### D2. Brushstrokes are anchored to the viewport's edges and to the text, never to the hero's height

This is the structural fix for both earlier failures.

- **Vertical anchors are edges of the composition.** The tree hangs from the **header
  rule** (the hero's top edge) at every width, including wide ones. The water hangs from
  the **bottom of the tagline** (the hero's content bottom). Neither depends on the hero's
  height, so neither moves between phones of different heights.
- **Horizontal anchors are the content column, with a bleed capped at the screen edge**
  (shipped 2026-09-27; until then the screen's edges). Each layer holds a column with
  Pico's `.container` geometry, and a brushstroke is positioned against it. The tree's
  right edge is the column's right edge plus `--brushstroke-tree-bleed`, or the screen edge
  if that comes first: `right: max(-bleed, (100% - 100vw) / 2)`, where `100%` is the
  column. With the bleed at 186 px (the 1878 mockup: the pines end 28 px inside a 214 px
  gutter) the tree hugs the screen edge up to about 1820 px and then follows the column,
  so on a 3440 px screen it sits 186 px past the content instead of 800 px away. On phones
  the bleed is `100vw`, which means "up to the screen edge" whatever the column does
  between 576 and 767 px, where Pico's container is a centred 510 px box. The water is
  116% of the column, starting 3.7% before it (the mockup's proportions), so it too stays
  with the content as the screen grows instead of spanning 89% of it. Anchoring to the
  screen fails on ultrawide screens (both brushstrokes drifted to the edges); anchoring to
  the column without the screen-edge cap chops the right pine at 1024 to 1536, where the
  bleed exceeds the gutter (measured 21 to 26% of the image cut).
- **Widths are viewport-relative (`vw`) with rem or px bounds**, so the same tokens can be
  reused by the text rules in D6. On the phone the tree is shown at its own 386 px (the
  owner judged the 2026-09-27 file at `width: auto`), wider than a phone, so the layer clips
  its left edge and the pine at its right stays put; it fades out under the text column
  (D6). Until 2026-09-27 the phone tree was the mockup's share of the screen, capped so a
  landscape phone did not get a 400 px tree. On wide screens the pines grow
  from 24rem at 768 to its native 565 px and stops there. The 24rem floor is what makes
  the name wrap at laptop widths: with an 18rem floor the one-line name ran under the
  file's foot at 1280 and 1536 and measured 1.5:1. (A fresh reader corrected the first
  wording here, which claimed the floor put the name's row over the upper haze; at the
  floor the name never reaches the box at all.)

Shipped (owner's decision, 2026-09-26): on wide screens the pines hang from the top of
the screen, `--brushstroke-tree-top: -5.5rem` and `--brushstroke-tree-right: 0px`, so
the file's flat-cut top sits just above the viewport edge and never shows, the right side
runs off the screen edge as in the reference screenshot, and the trunks stand at the
water's top edge rather than in it.
The first implementation hung them from the rule instead, because "contact" over the raw
crown measured 1.0 to 4.5:1; with the crown held at half strength above the rule and the
nav links in primary ink (D6) the links measure 5.1 to 11.3:1 and the reference placement
stands. `--brushstroke-tree-top: -5rem` on
the wide breakpoint restores the mockup's placement if the owner prefers it and accepts or
masks the nav overlap.

### D3. Bleed is clipped by a viewport-wide, zero-height layer; nothing global changes

The previous wash bloom needed `html { overflow-y: auto } body { overflow-x: clip }`, a hero
`clip-path` and `isolation`; all removed in dc40c7f. A page-level clip would also make the
existing "no horizontal scroll" e2e guard vacuous.

```text
section.hero
├── div.brushstroke-layer (aria-hidden)   position: absolute; inset-inline: 0; top: auto; height: 0;
│   └── div.container.brushstroke-layer__column   overflow-x: clip; overflow-y: visible on the layer;
│       └── picture > img.brushstroke.hero__tree  the column is position: relative, Pico's geometry
├── hgroup                                 (existing wordmark + tagline; now carries the top padding)
└── div.brushstroke-layer
    └── div.container.brushstroke-layer__column
        └── img.brushstroke.hero__water
```

Verified in Chromium and Firefox by a critic who compiled the site's SCSS with these rules:

- `top: auto` on an absolutely positioned box is its **static position**. The first layer
  is the hero's first child, so its top is the hero's content-box top; the second follows
  the `hgroup`, so its top is the hgroup's bottom. Measured: the first layer's top equals
  the rule's bottom exactly, at every width.
- `inset-inline: 0` resolves against the initial containing block, because no ancestor is
  positioned. Its width is the viewport minus any classic scrollbar (measured 753, 1863,
  360 with a 15 px scrollbar, no overflow). No `100vw`.
- Each brushstroke sits in the layer's column, a `position: relative` box with Pico's
  `.container` geometry, so its offsets and percentages are of the content column (the
  first draft had them direct children of the layer, so of the screen; see D2 for why
  that changed). `overflow-x: clip` on the layer clips whatever runs past the screen, and
  a descendant whose containing block is inside the layer is clipped by it. `clip` is the one overflow value that pairs with `visible` on the other
  axis, creates no scroll container and no stacking context, and lets the zero-height
  layer's children paint below it. `scrollWidth` equalled `clientWidth` at 13 widths while
  brushstrokes reached 1681 px to the right and -15 px to the left.
- The hero's top padding moves onto the `hgroup`, so the hero's content box starts at the
  rule and the tree's `top` is "distance from the rule". The hgroup's Pico bottom margin
  (`--pico-typography-spacing-vertical`) is zeroed so the water's `top` is "distance below
  the tagline"; the same amount is added to the hero's bottom padding so nothing below
  moves. The wordmark does not move: the hero's negative top margin still collapses the
  same way (measured).
- If there is no tagline, the water hangs from the wordmark. Accepted.

Support: `overflow: clip` is in Chrome 90, Firefox 81, Safari 16; Next's floor is Chrome
111 and Safari 16.4.

### D4. Brushstrokes paint under the paper grain, above the paper, under everything else

`z-index: -2`, hardcoded in the material rule. `body` has `isolation: isolate`
(`_materials.scss`), so body is the stacking context; `body::before`, the grain, is
`z-index: -1` inside it. Nothing between a brushstroke and `body` creates a stacking
context, so the brushstroke paints first, the grain multiplies over it (measured: a red
stand-in reads (128, 0, 0) under the grain, (255, 0, 0) at -1), then all in-flow text, the
cards, the header sheet (z 1 and 2) and the back-to-top button (fixed, z 2). The
brushstroke reads as pigment in the paper, and it cannot cover anything.

Two invariants, written as comments where they live and guarded by an e2e test:

- **The layer is viewport-wide only while nothing between it and the root is a containing
  block.** Any non-static `position`, `transform`, `translate`/`rotate`/`scale`, `filter`,
  `perspective`, `contain: layout | paint | strict | content`, `container-type`,
  `content-visibility` or `will-change: transform` on `.hero`, `main` or `body` shrinks
  the layer to that box. Measured: `.hero { position: relative }` clipped the bleed at the
  container while every geometry check stayed green, so a comment alone is not enough.
- **The brushstroke paints under the grain only while no ancestor is a stacking context.**
  Add `z-index` with position, `opacity < 1`, `isolation`, `mix-blend-mode`, `mask`,
  `clip-path`, `backdrop-filter` or `view-transition-name` to any ancestor and it paints
  above the grain, and above nothing else, so the failure is subtle.

`opacity` and any `mask` applied on the `<img>` itself create a stacking context on the
image only; that is harmless and is the only place they may go.

No `mix-blend-mode` on the brushstrokes: the mockups were composited in normal mode. No
depth knob: a z-index typed as 0 would paint over the text.

### D5. All composition knobs are one block on `.hero`, in `_home.scss`

```scss
// Below this width the phone tree hangs in the corner; from it, the two pines
// and the water. 48em is Pico's md step (768px), where the container becomes
// 700px. Mirrored as BRUSHSTROKE_WIDE_BREAKPOINT_EM; a unit test fails if they differ.
$brushstroke-wide-breakpoint: 48em;

.hero {
  // Owner knobs. Where the brushstrokes sit and how big and strong they are is
  // set here and nowhere else. Lengths are viewport-relative so the text rules
  // below can reuse them. See the 2026-09-24 spec for the mockup measurements.
  --brushstroke-opacity: 1;
  --brushstroke-tree-width: 386px;               // shipped 2026-09-27: the phone file at its own size (was min(52.5vw, 16rem))
  --brushstroke-tree-text-clear: 8rem;           // on a phone the tree is clear from the screen's left edge to here...
  --brushstroke-tree-text-fade: 5rem;            // ...and at full pigment this much further right (D6)
  --brushstroke-tree-top: -1rem;                 // negative rises above the header rule
  --brushstroke-tree-bleed: 100vw;               // how far past the content column the tree may run; 100vw = to the screen edge (shipped 2026-09-27)
  --brushstroke-tree-right: max(calc(-1 * var(--brushstroke-tree-bleed)), calc((100% - 100vw) / 2)); // derived: past the column by the bleed, never past the screen
  --brushstroke-tree-haze: 0.2;                  // shipped 0.2, not 0.15: keeps the name on one line at 1878
  --brushstroke-tree-crown: 0.5;                 // share of the pines' pigment kept above the rule, behind the nav
  --brushstroke-water-width: 116%;               // of the content column (shipped 2026-09-27; 89vw of the screen before)
  --brushstroke-water-left: -3.7%;               // before the column's left edge
  --brushstroke-water-top: 1rem;                 // below the tagline

  // Derived, not a knob: the room for text beside the tree (shipped name;
  // the draft called it --brushstroke-tree-left).
  --brushstroke-text-room: calc(100% + min(var(--brushstroke-tree-bleed), (100vw - 100%) / 2) - var(--brushstroke-tree-width));

  @media (min-width: $brushstroke-wide-breakpoint) {
    --brushstroke-tree-width: clamp(24rem, 30vw, 565px);   // grows to the file's native width and stops
    --brushstroke-tree-top: -5.5rem;                        // flat-cut top just above the viewport edge
    --brushstroke-tree-bleed: 186px;                        // the 1878 mockup: 28px inside a 214px gutter
  }
}
```

The phone values reproduce the 375 mockup; the wide values reproduce the 1878 mockup
except for the tree's top (D2). Exact numbers are confirmed during implementation against
the mockup coordinates and may be nudged; the e2e suite pins relations, not numbers.

The wide-breakpoint width appears in four places: this SCSS variable, the TS constant
`BRUSHSTROKE_WIDE_BREAKPOINT_EM` in `lib/brushstroke/brushstrokeWideBreakpoint.ts`, the
`<source media>` string (built from the constant), and the e2e edge pair (computed from
the constant). The unit test reading the SCSS is the only drift guard needed, following
`CARD_ASPECT_RATIO`.

The material rules live in `_materials.scss`, beside the grain, the ink rule and the
deckle, because the README already sends a maintainer there for "how the paper is layered"
and because the z-order contract they depend on is documented there:

```scss
.brushstroke-layer {
  position: absolute;
  inset-inline: 0;
  height: 0;
  overflow-x: clip;
  overflow-y: visible;
  pointer-events: none;
}

.brushstroke {
  position: absolute;
  display: block;
  max-width: none;       // Pico caps every img at 100%; a bleed needs more
  height: auto;
  z-index: -2;           // under body::before (the grain), above the paper
  opacity: var(--brushstroke-opacity, 1);
  pointer-events: none;  // no long-press "save image", no drag ghost
  user-select: none;
}
```

`_home.scss` keeps the knob block and the placement: `.hero__tree { top; right; width }`,
`.hero__water { display: none; top; left; width }` with the wide `display: block`.

`prefers-contrast: more` hides `.brushstroke-layer`, in the same block that hides the grain.
The layer rather than the image, because the water's own `display: block` on wide widths
lives in `_home.scss` and would outrank a hide on the image by source order.

### D6. Text yields by moving, never by darkening; legibility is measured

The studio-pigment spec says the palette bends to the contrast requirement. A brushstroke
never forces a palette change either: when text over a brushstroke fails, the brushstroke
or the text's line length gives way, in that order of preference for the owner's knobs.

Two of the mockup's overlaps fail arithmetic, not taste. `--ink-muted` clears 4.5:1 on the
measured paper by 2.5% of luminance, so it tolerates a brushstroke of at most about 0.14
effective alpha under it. The tree's haze is 0.36 to 0.79 alpha and its body is darker.
Measured on the assets: the phone tagline over the tree fails 73% of its painted pixels at
opacity 1 and still 31% at opacity 0.05; "contact" over the tree tip fails 66% at 1 and
19% at 0.2. No visible opacity passes.

So:

- **Below 18.75em of viewport the tree gives way entirely** (shipped, after the final
  review measured it). A phone zoomed to 150% or a reader with a 20 to 24 px default font
  leaves no room beside the name for any tree: the name's longest word reaches the tree's
  body at 1.6 to 2.9:1. `$brushstroke-narrow-breakpoint: 18.75em` (300 px at 16 px), in
  `em` so it follows both zoom and the default font, hides `.hero__tree` below it and
  lets the wordmark and tagline take their full `14ch` and `40ch`. Mirrored as
  `BRUSHSTROKE_NARROW_BREAKPOINT_EM` for the e2e, with the same drift guard. The tagline
  also carries `min-width: min-content` so no cap can split one of its words.
- **On phones the tree fades out under the text column** (shipped 2026-09-27, the owner's
  choice among three renders). The 386 px phone file spans the whole screen, so no line
  length can keep the muted tagline off it: as painted, the tagline measured 1.8 to 4.1:1
  at 300 to 430 px. `.hero__tree` therefore carries a left-edge mask: nothing painted from
  the screen's left edge up to `--brushstroke-tree-text-clear` (8rem), ramping to full
  pigment `--brushstroke-tree-text-fade` (5rem) further right; in rem, so a larger default
  font widens the band with the text. The mask reads the registered pair
  `--brushstroke-fade-left-clear` and `--brushstroke-fade-left` (lengths from the tree's
  own left edge, computed from the screen-relative knobs), and the legibility model lays
  paper over the same band. With it the tagline measures bare paper, 4.61, at every phone
  width, and the wordmark 6.2 at worst. The pines on wide screens use the same pair for
  their 8% left-edge feather. The name and the tagline sit at their longest word's width
  over the cleared band (the text-room formula below gives no room, and the `max(0px, ...)`
  in the rules makes that explicit). The two alternatives rendered and set aside: the
  tagline in primary ink with the tree at 85%, and the tree as painted with the floor
  waived.
- **On wide screens the tagline wraps short of the tree.** Its `max-width` is the lesser
  of the existing `40ch` and the distance from its left edge to the tree's left edge, derived
  from the tree knobs as `--brushstroke-text-room`: `calc(100% + min(var(--brushstroke-tree-bleed), (100vw - 100%) / 2) - var(--brushstroke-tree-width))`
  (`100%` is the hero's content width; the half-sum is the tree's left edge measured from
  the text's left edge). Until 2026-09-27, with the smaller phone file, this rule also
  wrapped the tagline into three short lines beside the tree at 375 and two at 414.
- **The wordmark wraps instead of running under the trees.** Same formula, plus the haze
  allowance: it may run `--brushstroke-tree-haze` of the tree's width into the box, which
  is the faint left edge of both files. Shipped with `min-width: min-content` as a floor:
  without it Pico's `overflow-wrap: break-word` split "billings" in two on a 375 phone; with
  it the name always wraps between words. At 430 px, where the name first fits on one line,
  the unwrapped name measured 2.92:1 over the canopy, so the rule applies on phones too. With the trees as a percentage of the viewport and
  the wordmark in `vw`, the wordmark's right edge climbs through each Pico container step
  while the tree does not, so without this the name collides with the pines at 844, 971,
  1279, 1366, 1440 and 1535 (measured minimum contrast 1.6 to 2.5). With it the name is
  one line at 1878 as in the mockup and wraps where there is no room, as it already does
  at 972 to 1023.
- **The pines' crown is held at half strength above the rule and the nav links use
  `--ink-primary`.** With the pines at the viewport top (D2), the raw crown behind the nav
  measured 1.0 to 4.5:1 for "about" and "contact". Two changes, both shipped: a mask layer
  on `.hero__tree` keeps the pigment above the rule at `--brushstroke-tree-crown` (0.5),
  ramping to full over the last 1rem; and the nav links, site-wide, take primary ink
  instead of muted (the studio-pigment spec's own rule: the palette bends to the contrast
  requirement). The mask reads two registered custom properties,
  `--brushstroke-fade-top` and `--brushstroke-fade-to`, and the legibility model below
  reads the same two from the image's computed style and lays paper over the band at one
  minus the share, so the test sees what the browser paints.
- **"featured work" over the water** passes as painted (measured minimum about 7.9:1).

Measured minimums as shipped (model in the next paragraph; reproduce with
`BRUSHSTROKE_MEASURE=1`, see `docs/hero-brushstrokes.md`): at 375 the wordmark 10.6:1
(its ink touches only haze), the tagline 4.61 (bare paper); at 1878 the wordmark 10.1,
"featured work" over the water 7.7, "contact" over the faded crown 9.35; at the suite's
widths the lowest nav link is "contact" at 1366, 5.03 (measured 2026-09-27). The lowest
value the suite accepts is 3.0 for the wordmark, and the closest the tree comes to it is
3.88 at 300 px.

The crown share has a measured ceiling. A fresh reader asked to raise it to 0.8 and
bisected it against the 4.5:1 floor at every width from 768 to 1920 in 16 px steps
(`BRUSHSTROKE_SCAN`): 0.8 puts "about" and "contact" at 2.7 to 4.3:1 at nine of the
suite's wide widths, and the ceiling is 0.551, bound by "contact" between 1088 and 1200
px, where the link sits over the densest part of the crown. The suite's sampled widths
alone would allow 0.555, so the ceiling is a property of the sweep, not the samples. The
knobs interact: `--brushstroke-tree-haze` and `--brushstroke-tree-crown` were measured
for the shipped width, top and right, and a change to any of those three moves both
ceilings (a 15% smaller tree 2rem in, tried by another reader, needed haze 0.05 and crown
0.45). A stronger crown behind the links needs a different placement (Q1); the ink is
already `--ink-primary`, the darkest on the palette.

The e2e test that guards this is deterministic and screenshot-free: in the page, for each
rendered `.brushstroke`, draw it into an `OffscreenCanvas` at its bounding rectangle and
opacity over the measured paper colour `rgb(241, 237, 230)`; then, for each text element in
the set, read the pixels under its line boxes (`Range.getClientRects()`, never the element
box, which has empty space) and assert the WCAG contrast of the element's computed colour
against every pixel is at least 4.5 (3 for the wordmark and the "featured work" heading,
which are large text; 3 for the menu toggle icon, a non-text contrast). The set: wordmark,
tagline, "featured work", each nav link separately (their `::marker` squares are excluded
that way), and the menu toggle. Pixels are per-brushstroke pigment over flat paper, so
there is no grain noise to average out. If a check fails, the fix is a knob, then the text
rule above; never a palette token.

### D7. Assets have hard-cropped edges the mockup never showed

The first `trees` export (565 x 462) was cut flat across its top through the right pine's
spire, and its bottom row carried alpha up to 0.76 across 226 px with its left column up
to 0.32 for its full height; those edges showed as ruler lines at 768, 1280 and 1878 and
are feathered by two gradient layers of the `mask-image` on `.hero__tree`; a third layer
holds the crown at half strength above the rule (D6), and the three intersect. The flat
top is hidden by placement (D2), not by the mask. Two later exports with the spire intact
(585 x 588 and 534 x 541) needed no feather but put their lower haze in the water, and
were set aside.
The `water` file's top row still carries up to 0.43 across 145 px, so `.hero__water` keeps
a top feather of 12%. A mask on the image isolates only the image, so the paint order is
untouched.

## Components

| Unit | Kind | Does | Depends on |
| --- | --- | --- | --- |
| `BrushstrokeLayer` | component | The viewport-wide clipping layer around its children. `aria-hidden`. Doc comment carries the two D4 invariants and the static-position contract (must be a block-flow child; a grid or flex parent would ignore `top: auto`). | nothing |
| `HomeHero` | component (existing) | One layer before the `hgroup` with the tree `<picture>`, one after with the water `<img>`. | `BrushstrokeLayer`, `brushstrokeWideBreakpoint` |
| `lib/brushstroke/brushstrokeWideBreakpoint.ts` | constant | `BRUSHSTROKE_WIDE_BREAKPOINT_EM = 48`, mirrored from `_home.scss`. | nothing |
| `_materials.scss` | partial (existing) | `.brushstroke-layer`, `.brushstroke`, the `prefers-contrast` hide, and a note on the `body { isolation }` comment that the brushstrokes depend on it. | Pico |
| `_home.scss` | partial (existing) | The knob block, `.hero__tree`, `.hero__water`, the hgroup padding and margin, the wordmark and tagline `max-width` rules. | `_materials.scss` |
| `tests/e2e/brushstrokeLegibility.ts` | helper | In-page canvas compositing and contrast, per D6. Flat beside `layout.spec.ts`, where `samplePixel.ts` used to live. Exercised by the e2e that uses it; it self-checks by asserting plain paper against `--ink-muted` measures about 4.61. | nothing |

## Tests

Test-first. Each test is written and seen to fail before the code that passes it.

**Unit (Vitest, jsdom)**

- `tests/lib/brushstroke/brushstrokeWideBreakpoint.test.ts`: the constant equals
  `$brushstroke-wide-breakpoint` read from `_home.scss`.
- `tests/components/BrushstrokeLayer.test.tsx`: `aria-hidden="true"`, class
  `brushstroke-layer`, children render inside it.
- `tests/components/HomeHero.test.tsx`: the existing "no decoration" assertion becomes: the
  hero's children are, in order, a brushstroke layer, the `hgroup`, a brushstroke layer
  (D3 depends on that order). The first holds a `<picture>` with one `<source>` whose
  `media` is built from the constant and whose `srcset` is `/brushstrokes/trees.webp`, and
  an `<img class="brushstroke hero__tree" src="/brushstrokes/tree.webp" alt="" decoding="async">`.
  The second holds `<img class="brushstroke hero__water" src="/brushstrokes/water.webp" alt="" loading="lazy">`.
  Pixel sizes are not asserted here; the e2e checks them against the real files. The
  heading, badge, tagline and `data-site-wordmark` tests stay as they are.

**End to end (Playwright, static export)** in `tests/e2e/home.spec.ts`. A fresh browser
context per viewport (as `artwork-navigation.spec.ts` does), `document.fonts.ready`, then
`decode()` on every rendered `.brushstroke` and two animation frames, because `<picture>`
re-selects its source asynchronously and a screenshot before decode measures plain paper.
Half-pixel positions are common, so tolerances are explicit `Math.abs(d) <= 1`.

Widths (`tests/e2e/homeViewports.ts`): 280 x 600, 300 x 600, 320 x 640, 375 x 667,
375 x 812, 390 x 844, 414 x 896, 430 x 932, 575 x 800, 576 x 800, 767 x 1000, 768 x 1024,
844 x 390, 971 x 800, 1024 x 768, 1279 x 800, 1280 x 800, 1366 x 768, 1440 x 900,
1535 x 900, 1536 x 900, 1878 x 1269, 1920 x 1080, 2560 x 1440, 3440 x 1440 (the last
two wider than the 1450 px column). The odd ones are the worst case of
each Pico step, where the wordmark is widest relative to the container; 280 and 300 sit
either side of the narrow step. Two more runs at 375 with 20 px and 24 px default fonts,
and one with a real scrollbar at 375, 1280 and 1878. An on-demand spec,
`brushstrokeMeasure.spec.ts`, prints the numbers the suite gates on and bisects a knob's
ceiling; it shares the checks, floors and viewports with the suite.

- **Anchored to the rule (failure 2):** `(tree.top - rule.bottom) / rootFontSize` is one
  value across all widths, and identical at 375 x 667 and 375 x 812.
- **In the corner:** the layer's column has `main`'s x and width within 1, and the tree's
  right edge is the lesser of the column's right edge plus `--brushstroke-tree-bleed` and
  the screen edge, within 1. `boundingBox()` reports the unclipped box, which is what this
  needs. The water's width is `--brushstroke-water-width` of the column within 2.
- **No horizontal scroll** at the widths `layout.spec.ts` does not already cover.
- **Layer is viewport-wide:** every `.brushstroke-layer` spans `[0, documentElement.clientWidth]`.
- **Nothing traps the paint order:** walking from each `.brushstroke` to `body`, no
  ancestor has a computed style that creates a stacking context or a containing block
  (the D4 lists).
- **Art direction:** below the breakpoint the water is hidden (`toBeHidden`; its
  `boundingBox()` is null) and the tree's `currentSrc` ends in `tree.webp`; from it the
  water is visible below the tagline's bottom and `currentSrc` ends in `trees.webp`. The
  pair `EM * 16 - 1` and `EM * 16` pins the edge.
- **Files are what the markup says:** every rendered `.brushstroke` has `complete`,
  `naturalWidth === width` and `naturalHeight === height`. Also the water's width is not
  capped: its rendered width follows the knob (89vw, so 1671 at 1878) within 2.
- **No wasted download:** at 375, no request for `water.webp` is made.
- **Legibility (D6, failure 1):** the canvas contrast check over the text set, every width.
- **`prefers-contrast: more`** (`page.emulateMedia({ contrast: 'more' })`): no
  `.brushstroke` is visible.

No pin to mockup pixel coordinates and no `toHaveScreenshot`: both turn every owner nudge
into a two-place edit, the grain and fonts differ per machine, the tagline is Sanity
content, and the desktop tree has no measured reference. The mockup table above is
checked once by hand during implementation.

The existing `layout.spec.ts` and `header.spec.ts` keep running unchanged.

## Documentation

- `README.md`:
  - Rule 2 becomes: "**Texture, not decoration.** The surface vocabulary is the paper
    grain, the ink rules, and the artist's own painted brushstrokes: the work itself, never
    an imitation of it. There are no synthetic washes or blooms. Brushstrokes sit under the
    grain, in a page's opening band, at most two per viewport, and never where they pull
    text below the contrast floor."
  - "Where to change what" gains: "Where the home brushstrokes sit, how big and strong
    they are | `web/styles/_home.scss` (the knob block on `.hero`)[^3]" with the footnote
    on the mirrored breakpoint; "Swap a brushstroke's file | `web/public/brushstrokes/`
    plus its `width`/`height` in `web/components/HomeHero.tsx`"; and the materials row
    becomes "Paper texture, ink rules, deckle edge, how brushstrokes are layered and
    clipped".
  - A short "Brushstroke assets" section: where the masters live, the `sharp` q80 export
    command, and that text over a brushstroke is measured by the home e2e.
  - The palette section's "that composite is what text outside a `.paper-sheet` sits on"
    gains "except over a brushstroke, which the home e2e measures".
- `_materials.scss`: the `body { isolation }` comment notes the brushstrokes depend on it.
- `docs/superpowers/specs/2026-09-01-studio-pigment-design.md`: one line at the "text
  never sits directly on a bloom" rule pointing here.

## Out of scope

- Serving the brushstrokes from Sanity.
- Retina renditions. The masters are 1x; the owner's upgrade notes list what to re-export.
- Feathered re-exports of the hard-cropped edges (D7); a CSS mask is the interim fix.
- `.hero__tagline`'s `font-size: clamp(...)` never applies: Pico's
  `hgroup > *:not(:first-child):last-child { font-size: 1rem }` beats it on specificity, so
  the tagline is 1rem at every width. Pre-existing; the water's anchor is measured against
  the tagline as rendered. Fixing it would move the water about 5 px at 1878.
- Any other page. `BrushstrokeLayer` is reusable, but on `/about` the grid spread, the
  transformed portrait and the positioned timeline are exactly the traps in D4; a spec for
  that page would have to place the layer above them.

## Decisions the owner may want to reverse

- **Q1, resolved 2026-09-26: trees at the viewport top**, crown at half strength above
  the rule, nav links in primary ink (D2, D6). To hang them from the rule again: wide
  block `--brushstroke-tree-top: -1rem`, `--brushstroke-tree-bleed: 155px` (186 minus a 1.5rem gap),
  `--brushstroke-tree-crown: 1`; the trunks then stand in the water.
- **Q2, resolved 2026-09-27: the phone tree fades out under the text column** (D6), the
  owner's pick from three renders. `--brushstroke-tree-text-clear` and `-fade` set how
  wide the clear band is; the alternative that also passes is the tagline in primary ink
  with the tree at 85%.
- **Q3. The wordmark wraps at widths where it would run into the tree** (D6), on phones
  from about 415 px (where it would otherwise fit on one line over the canopy) as well as
  on wide screens between Pico's steps. Raising `--brushstroke-tree-haze` lets it run
  further into the faint edge; the legibility test says how far is too far.
- **Q4. Water on phones** is not downloaded (D1). Showing it there is one `display` change
  (the knobs are already viewport-relative, so no phone values are needed), plus dropping
  the "no water request" e2e assertion and rewording the `loading="lazy"` rationale, which
  then exists so a decoration never outranks the featured thumbnails. A fresh reader did
  exactly this in under an hour; the recipe is in `docs/hero-brushstrokes.md`.
