# Adjusting the home hero brushstrokes

A working guide. The design and its reasons are in
`docs/superpowers/specs/2026-09-24-hero-brushstroke-design.md`; this page is what to touch,
what it drags along, and how to prove it. Written 2026-09-27 after three fresh readers tried
to change the layout from the repository alone and reported what they had to work out.

## How it works, in five sentences

Two zero-height, viewport-wide layers inside `.hero` (`BrushstrokeLayer`, one before the
heading group and one after it) each clip their own horizontal overflow, so a brushstroke can
run off the screen edge without a scrollbar and without any overflow rule on `body`. Each
brushstroke is an `<img>` absolutely positioned inside a column in its layer that has the
page's content-column geometry: the tree hangs from the header rule and follows the column's
right edge (running a fixed bleed past it, or to the screen edge when that is nearer), the
water from the bottom of the tagline as a share of the column, and nothing is tied to the
hero's height. The wordmark and tagline derive their line length from the same values and
wrap short of the pigment. Brushstrokes
paint at `z-index: -2`, under the paper grain and under every piece of text. A Playwright
suite pins the relations (anchor, corner, clip, paint order, art direction, legibility) at
23 widths, two default font sizes and a real scrollbar; it does not pin pixel coordinates.

## The knobs

All in one block on `.hero` at the top of `web/styles/_home.scss`. Every length keeps a
unit, even zero: a bare `0` inside `calc()` silently disables the text rules. `rem` values
follow Pico's stepped root font (16 to 21 px between 576 and 1536), so "2rem" is 32 px on a
phone and 42 px on a wide desktop; write `px` for a fixed distance.

| Knob | Moves | Coupled with | Guarded by |
| --- | --- | --- | --- |
| `--brushstroke-tree-width` | how big the tree is; a share of the viewport with rem and px bounds (phone `386px`, the file's own size, wider than the screen so the layer clips its left edge; wide `clamp(24rem, 30vw, 565px)`) | the wordmark's and tagline's line length shrink as it grows; on wide screens the 24rem floor is what makes the name wrap instead of running under the pines, and the 565px cap is the file's native width | anchor and corner checks; legibility |
| `--brushstroke-tree-top` | distance below the header rule; negative rises above it (phone `-1rem`, wide `-5.5rem`, the file's flat-cut top just above the screen edge) | the crown band: the fade above the rule is exactly minus this value tall | anchor check |
| `--brushstroke-tree-bleed` | how far past the content column the tree may run, never past the screen edge (phone `100vw`, meaning up to the screen edge; wide `186px`, the mockup's 28px inside a 214px gutter) | text room: less bleed means less of the name may reach the pines; on a 3440px screen the tree sits this far past the content instead of at the far edge | corner check; legibility |
| `--brushstroke-tree-haze` | share of the tree's width the wordmark may run into (0.2) | tuned to the shipped size and placement: the file's left edge is faint haze at the wordmark's row only while the tree is at least as tall as it is now | legibility, wordmark at 3:1 |
| `--brushstroke-tree-crown` | share of the pines' pigment kept above the rule, behind the nav links (0.5) | the nav links are already primary ink; measured ceiling 0.551 at the shipped placement, bound by "contact" between 1088 and 1200 px | legibility, nav links at 4.5:1 |
| `--brushstroke-tree-text-clear`, `--brushstroke-tree-text-fade` | on a phone, how far from the screen's left edge the tree stays unpainted (8rem) and how much further it takes to reach full pigment (5rem); the text sits over that clear band | rem, so a larger default font widens the band with the text; the pines on wide screens ignore these and use a fixed 8% left feather | legibility, tagline at 4.5:1 |
| `--brushstroke-water-width`, `-left`, `-top` | the water's size and left edge as shares of the content column, and its distance below the tagline (`116%`, `-3.7%`, `1rem`) | "featured work" sits on it; the heading is checked at 3:1; it stays with the content on a wide screen | water anchor and width checks; legibility |
| `--brushstroke-opacity` | every brushstroke's strength (1) | | legibility |
| `$brushstroke-wide-breakpoint` (48em) | where the phone tree and no water give way to the pines and the water | mirrored in `web/lib/brushstroke/brushstrokeWideBreakpoint.ts` for the `<picture>` and the e2e; a unit test fails if they differ | drift test; art-direction edge pair |
| `$brushstroke-narrow-breakpoint` (18.75em) | below it there is no room beside the name for a tree, so the tree hides and the text takes its full line length | mirrored likewise | drift test; the 280 and 300 widths |

Derived, not a knob: `--brushstroke-text-room`, the room for text beside the tree. Setting
it moves nothing.

The e2e reads knobs back through `getComputedStyle`: `--brushstroke-tree-top` and
`-bleed` must be a plain `rem`, `px` or `vw` value, and `--brushstroke-water-width` a plain
percentage. A `min()` or `clamp()` there makes the test throw rather than fail.
`--brushstroke-tree-right` is derived from the bleed; do not set it.

## The loop

Every change, however small:

```bash
cd web
npm run build                                   # the e2e tests out/, not the source
npx playwright test tests/e2e/home.spec.ts      # the brushstroke suite, about 30 s
```

If another checkout on the machine is serving on port 4173, the suite reuses it and tests
that checkout's build. Copy `playwright.config.ts` to an untracked file with a free port and
pass it with `--config`. On a loaded machine add `--workers=3`; unrelated tests time out at
30 s otherwise. The whole suite needs `PUBLIC_CONTACT_ALIAS` set to the address the build
published (`grep -o 'mailto:[^"]*' out/index.html`), or one contact test fails.

Then record what changed: the knob block's comment if the reason changed, the spec's D5
block and its "measured minimums" paragraph if a number did.

## Recipes

**Move or resize the tree.** Change `--brushstroke-tree-width`, `-top` or `-right` in the
phone block or the wide block. Expect the name and tagline to wrap differently, and expect
`--brushstroke-tree-haze` and `--brushstroke-tree-crown` to need retuning if the tree's
size or placement changed: they were measured for the shipped values. Run the loop; a
legibility failure names the element and width.

**Make the pines stronger or weaker behind the nav.** `--brushstroke-tree-crown`, 0 to 1.
At the shipped placement anything above 0.55 fails "contact" at laptop widths. To find the
ceiling after a move, scan it (below).

**A brushstroke that must run under text** (the phone tree does): give it a left fade
through the registered pair `--brushstroke-fade-left-clear` and `--brushstroke-fade-left`
(lengths or percentages from its own left edge), as `.hero__tree` does; the legibility model
reads the pair back, so the fade counts. A plain `mask-image` the model does not know about
makes the test pessimistic, never optimistic.

**Swap a file.** Put the new WebP in `web/public/brushstrokes/` under the same name, update
the `width`/`height` beside its path in `web/components/HomeHero.tsx`, and check the file's
edges: a straight cut through the haze shows as a ruler line and needs a gradient
`mask-image` feather on that image in `_home.scss` (the pines have one on the left and
bottom, the water on its top). The export command and the masters' location are in the
README under "Brushstroke assets". The e2e checks the rendered file's size against the
attributes.

**Show the water on phones.** Remove `display: none` from `.hero__water` in `_home.scss`
(the knobs are already viewport-relative, so a phone gets its share of the screen), delete
the "no water request" assertion in `home.spec.ts` and let the water checks run at every
width, and rewrite the `loading="lazy"` rationale in `HomeHero.tsx` (it then exists so a
decoration never outranks the featured thumbnails, not to skip a download). A phone then
downloads the 213 KB file.

**Put a brushstroke on another page.** `BrushstrokeLayer` is reusable, but only where no
ancestor between it and `body` is positioned, transformed, filtered, contained, or a
stacking context, and only as a block-flow child (its `top: auto` is its static position; a
grid or flex parent ignores that). The about page's grid spread, transformed portrait and
positioned timeline are exactly those traps. The "no ancestor traps them" check in
`home.spec.ts` is the test to copy.

## Reading a failure

- `.site-header__links a "Contact" at 1366px  Expected: >= 4.5  Received: 2.7`: the pines
  are too strong behind that link at that width. Lower `--brushstroke-tree-crown`, or move
  the tree. Never darken the text; the links are already the darkest ink.
- `.hero__wordmark "Zenon Billings" at 1280px  Expected: >= 3  Received: 1.5`: the name's
  row is landing on the tree's body. Lower `--brushstroke-tree-haze`, raise the width floor,
  or move the tree.
- `name words split at 375px ["billings"]`: a cap narrower than the longest word; the
  `min-width: min-content` floor on the wordmark should prevent it, so something removed it.
- `tree.y - (rule.bottom + top)` more than 1 px off: the tree is anchored to something
  other than the rule; an ancestor of the layer gained a position or transform.
- the column's x or width differs from `main`'s: the layer's column lost Pico's
  `container` class, or `main` gained padding the column does not have.
- `layerBox.width - clientWidth` more than 1 px off, or `scrollWidth > clientWidth`: the
  layer is no longer viewport-wide; an ancestor became a containing block.
- `trees.webp: 534x541` in the "files are what the markup says" list: the file and the
  `width`/`height` attributes disagree.
- `--brushstroke-tree-top is "calc(...)", expected <n>rem or <n>px`: a knob the test reads
  was written in a form it cannot resolve.

## Measuring instead of guessing

The suite only gates. To see the numbers, or find how far a knob can go:

```bash
cd web && npm run build
BRUSHSTROKE_MEASURE=1 npx playwright test tests/e2e/brushstrokeMeasure.spec.ts --reporter=line
BRUSHSTROKE_SCAN=--brushstroke-tree-crown BRUSHSTROKE_WIDTHS=768-1920:16 \
  npx playwright test tests/e2e/brushstrokeMeasure.spec.ts --reporter=line
```

The first prints the minimum contrast of every checked element at every width and the
lowest per element. The second bisects a 0 to 1 knob on `.hero` at every width and prints
the largest value that keeps every check at its floor, and which link binds it. Add widths
with `BRUSHSTROKE_WIDTHS` (a range with a step, or a list): the suite samples, and a ceiling
can sit between samples. Both use the suite's own contrast model, so they report what the
suite would judge.

## Do not

- Give `.hero`, `main` or `body` a `position`, `transform`, `filter`, `opacity` below 1,
  `isolation`, `contain`, `container-type` or `will-change`. The layers shrink to that box
  and the brushstrokes flip above the grain. The ancestor-walk test catches it.
- Rely on `overflow` rules on `html` or `body` for a brushstroke's bleed. The layer clips
  its own. (The statement's wash bloom sets `body { overflow-x: clip }` for its own bleed;
  the brushstrokes neither need it nor are affected by it.)
- Mask the layer or `.hero`; a mask belongs on the image, where it isolates only the image.
- Put the knobs anywhere but the block on `.hero`.
- Treat `docs/superpowers/plans/2026-09-24-hero-brushstroke.md` as current: it is the
  execution record and quotes draft values.
