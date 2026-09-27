# Hero Brushstrokes Implementation Plan

> **Historical record.** This is the plan the branch was built from on 2026-09-24. The
> values and snippets in it are drafts; several changed during implementation and again at
> the owner's request on 2026-09-26. The shipped state is described in
> `docs/hero-brushstrokes.md` (how to adjust it) and the spec (why it is so). Do not copy
> numbers from here.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the artist's painted tree and water brushstrokes on the home hero so they match the owner's two mockups, hold on every width from 320 to 1920, and can be nudged from one knob block.

**Architecture:** Two zero-height, viewport-wide, horizontally clipping layers inside `.hero` (one before the heading group, one after) hold absolutely positioned decorative images anchored to the header rule, the tagline and the screen's right edge. All placement values are custom properties on `.hero`; the wordmark and tagline derive their `max-width` from the same values so text wraps instead of running under a brushstroke. An e2e suite pins the relations (anchor, corner, clip, paint order, legibility), not pixel coordinates.

**Tech Stack:** Next.js 16 static export, React 19, SCSS over Pico.css, Vitest + jsdom, Playwright 1.62 (Chromium).

**Spec:** `docs/superpowers/specs/2026-09-24-hero-brushstroke-design.md`

## Global Constraints

- Root `package.json` never gains dependencies; nothing new is installed anywhere (AGENTS.md §2).
- Names describe what a thing is, never where it is used: `tree.webp`, `trees.webp`, `water.webp`, `--brushstroke-*`, `$brushstroke-wide-breakpoint`, `brushstroke-layer`.
- Colour and spacing tokens stay in `_tokens.scss`; the composition knobs are page-specific and live on `.hero` in `_home.scss`; material rules live in `_materials.scss`.
- No inline styles. No edits to Pico. No `html`/`body` overflow rules. No `z-index`, `position`, `transform`, `filter`, `opacity`, `isolation`, `contain`, `container-type` on `.hero`, `main` or `body`.
- The wide breakpoint is `48em`, in SCSS as `$brushstroke-wide-breakpoint` and in TS as `BRUSHSTROKE_WIDE_BREAKPOINT_EM = 48`.
- Text never darkens to pass contrast; a brushstroke knob or a text `max-width` rule changes instead.
- Every command run for this work is documented in `README.md` (AGENTS.md §6).
- Prettier: no semicolons, single quotes, width 100, trailing commas. `npm run lint` runs with `--max-warnings 0`.

## Review Focus

1. **No tagline in Sanity** (`tagline` is optional): the water must hang from the wordmark's bottom and the tagline `max-width` rule must not error. Pinned in Task 4's e2e by falling back to the wordmark's box when `.hero__tagline` is absent.
2. **Classic scrollbar** (Windows, or `overlay-scrollbars` off): the layer must equal `clientWidth`, not `100vw`, or the page scrolls sideways. Pinned in Task 4's e2e "layer is viewport-wide" and "no horizontal scroll" at every width.
3. **Resize across the breakpoint on a live page** (rotating a phone): the `<picture>` keeps the old file's ratio until the new one loads unless `<source>` carries `width`/`height`. Pinned in Task 3's unit test (attributes present) and Task 4's e2e (`naturalWidth === width` after decode).
4. **Reader default font size not 16px**: `48em` no longer equals Pico's 768px step, so the wide composition may start at a different width than the container step; the layout must still not collide. Covered structurally by the `max-width` rules (Task 4) and the legibility test (Task 5), which do not assume 16px; no extra test.
5. **A future ancestor gains a stacking context or containing block** (e.g. someone adds `position: relative` to `.hero`): the bleed silently clips at the container and the paint order flips above the grain. Pinned in Task 4's e2e ancestor walk.

---

### Task 1: The wide breakpoint constant and its drift guard

**Files:**
- Create: `web/lib/brushstroke/brushstrokeWideBreakpoint.ts`
- Modify: `web/styles/_home.scss` (add the SCSS variable at the top)
- Test: `web/tests/lib/brushstroke/brushstrokeWideBreakpoint.test.ts`

**Interfaces:**
- Produces: `BRUSHSTROKE_WIDE_BREAKPOINT_EM: number` (48) and `brushstrokeWideMediaQuery(): string` returning `(min-width: 48em)`. Task 3 uses both; Task 4's e2e imports the constant by relative path.

- [ ] **Step 1: Write the failing test**

```ts
// web/tests/lib/brushstroke/brushstrokeWideBreakpoint.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  BRUSHSTROKE_WIDE_BREAKPOINT_EM,
  brushstrokeWideMediaQuery,
} from '@/lib/brushstroke/brushstrokeWideBreakpoint'

// The stylesheet owns the breakpoint: it is where the phone tree gives way to
// the two pines and the water. The <picture> in HomeHero has to switch files
// at the same width, so the constant mirrors it, and this test is what keeps
// the two from drifting apart.
describe('BRUSHSTROKE_WIDE_BREAKPOINT_EM', () => {
  it('matches $brushstroke-wide-breakpoint in _home.scss', () => {
    const home = readFileSync(resolve(__dirname, '../../../styles/_home.scss'), 'utf8')
    const match = home.match(/\$brushstroke-wide-breakpoint:\s*(\d+)em\s*;/)

    expect(match, 'expected a $brushstroke-wide-breakpoint: <n>em; variable').not.toBeNull()
    expect(BRUSHSTROKE_WIDE_BREAKPOINT_EM).toBe(Number(match![1]))
  })

  it('builds the media query the <picture> source uses', () => {
    expect(brushstrokeWideMediaQuery()).toBe('(min-width: 48em)')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx vitest run tests/lib/brushstroke/brushstrokeWideBreakpoint.test.ts`
Expected: FAIL, "Failed to resolve import @/lib/brushstroke/brushstrokeWideBreakpoint".

- [ ] **Step 3: Write the constant and the SCSS variable**

```ts
// web/lib/brushstroke/brushstrokeWideBreakpoint.ts

// Mirrors $brushstroke-wide-breakpoint in styles/_home.scss, which owns the
// value: below it the phone tree hangs in the corner, from it the two pines and
// the water. The <picture> in HomeHero has to switch files at the same width
// the stylesheet switches the composition. A unit test fails if they drift.
export const BRUSHSTROKE_WIDE_BREAKPOINT_EM = 48

export const brushstrokeWideMediaQuery = () => `(min-width: ${BRUSHSTROKE_WIDE_BREAKPOINT_EM}em)`
```

Prepend to `web/styles/_home.scss`:

```scss
// Below this width the phone tree hangs in the corner; from it, the two pines
// and the water. 48em is Pico's md step (768px), where the container becomes
// 700px wide. An em query reads the browser default, not Pico's stepped root
// size, like $menu-breakpoint. Mirrored as BRUSHSTROKE_WIDE_BREAKPOINT_EM in
// lib/brushstroke; a unit test fails if the two differ.
$brushstroke-wide-breakpoint: 48em;

```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run tests/lib/brushstroke/brushstrokeWideBreakpoint.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/brushstroke/brushstrokeWideBreakpoint.ts web/styles/_home.scss web/tests/lib/brushstroke/brushstrokeWideBreakpoint.test.ts
git commit -m "feat(home): mirror the brushstroke wide breakpoint in TypeScript with a drift guard"
```

---

### Task 2: `BrushstrokeLayer`

**Files:**
- Create: `web/components/BrushstrokeLayer.tsx`
- Test: `web/tests/components/BrushstrokeLayer.test.tsx`

**Interfaces:**
- Produces: `BrushstrokeLayer({ children }: { children: ReactNode })` rendering `<div class="brushstroke-layer" aria-hidden="true">`. Task 3 renders two of them inside `.hero`.

- [ ] **Step 1: Write the failing test**

```tsx
// web/tests/components/BrushstrokeLayer.test.tsx
import { render } from '@testing-library/react'
import BrushstrokeLayer from '@/components/BrushstrokeLayer'

describe('BrushstrokeLayer', () => {
  it('wraps its children in the layer the stylesheet clips and positions', () => {
    const { container } = render(
      <BrushstrokeLayer>
        <img alt="" src="/brushstrokes/tree.webp" />
      </BrushstrokeLayer>,
    )
    const layer = container.querySelector('.brushstroke-layer')!
    expect(layer).toBeInTheDocument()
    expect(layer.querySelector('img')).toBeInTheDocument()
  })

  it('is hidden from assistive technology, being decoration', () => {
    const { container } = render(<BrushstrokeLayer />)
    expect(container.querySelector('.brushstroke-layer')).toHaveAttribute('aria-hidden', 'true')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx vitest run tests/components/BrushstrokeLayer.test.tsx`
Expected: FAIL, cannot resolve `@/components/BrushstrokeLayer`.

- [ ] **Step 3: Write the component**

```tsx
// web/components/BrushstrokeLayer.tsx
import type { ReactNode } from 'react'

// A viewport-wide, zero-height band that clips its own horizontal overflow, so
// a painted brushstroke inside it can hang off the screen's edge without giving
// the page a horizontal scrollbar. The stylesheet (.brushstroke-layer in
// _materials.scss) does the work; this is the markup it needs.
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
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run tests/components/BrushstrokeLayer.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add web/components/BrushstrokeLayer.tsx web/tests/components/BrushstrokeLayer.test.tsx
git commit -m "feat(materials): add the BrushstrokeLayer clipping band"
```

---

### Task 3: The brushstroke markup in `HomeHero` and the asset files

**Files:**
- Create: `web/public/brushstrokes/tree.webp`, `web/public/brushstrokes/trees.webp`, `web/public/brushstrokes/water.webp` (copies of the owner's `_q80` files)
- Modify: `web/components/HomeHero.tsx`
- Test: `web/tests/components/HomeHero.test.tsx`

**Interfaces:**
- Consumes: `BrushstrokeLayer`, `brushstrokeWideMediaQuery()`.
- Produces: the DOM Task 4's styles and e2e target: `.hero > .brushstroke-layer > picture > img.brushstroke.hero__tree`, `.hero > hgroup`, `.hero > .brushstroke-layer > img.brushstroke.hero__water`.

- [ ] **Step 1: Copy the assets**

```bash
mkdir -p web/public/brushstrokes
cp /mnt/d/files/pictures/art_by_dad/assets/brushstroke_tree_q80.webp web/public/brushstrokes/tree.webp
cp /mnt/d/files/pictures/art_by_dad/assets/brushstroke_trees_desktop_q80.webp web/public/brushstrokes/trees.webp
cp /mnt/d/files/pictures/art_by_dad/assets/brushstroke_water_q80.webp web/public/brushstrokes/water.webp
ls -la web/public/brushstrokes
```

Expected sizes: about 38 KB, 111 KB, 219 KB.

- [ ] **Step 2: Replace the "no decoration" unit test with the structure the layers need**

In `web/tests/components/HomeHero.test.tsx`, add the import and replace the last `it(...)` block:

```tsx
import { brushstrokeWideMediaQuery } from '@/lib/brushstroke/brushstrokeWideBreakpoint'
```

```tsx
  // The two brushstroke layers hang from their static positions: the first from
  // the hero's top (the header rule), the second from the bottom of the heading
  // group (the tagline). That only holds while they sit exactly here in the DOM.
  it('hangs a brushstroke layer before the heading group and one after it', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    const hero = container.querySelector('.hero')!
    expect(Array.from(hero.children).map((child) => child.className)).toEqual([
      'brushstroke-layer',
      '',
      'brushstroke-layer',
    ])
    expect(hero.children[1].tagName).toBe('HGROUP')
  })

  it('art-directs the tree: one pine on a phone, two pines from the wide breakpoint', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    const picture = container.querySelector('.hero > .brushstroke-layer:first-child > picture')!
    const source = picture.querySelector('source')!
    const tree = picture.querySelector('img')!

    expect(source).toHaveAttribute('media', brushstrokeWideMediaQuery())
    expect(source).toHaveAttribute('srcset', '/brushstrokes/trees.webp')
    // The wide file has its own aspect ratio; without these the box keeps the
    // phone file's ratio until the bytes arrive.
    expect(source).toHaveAttribute('width')
    expect(source).toHaveAttribute('height')

    expect(tree).toHaveClass('brushstroke', 'hero__tree')
    expect(tree).toHaveAttribute('src', '/brushstrokes/tree.webp')
    expect(tree).toHaveAttribute('alt', '')
    expect(tree).toHaveAttribute('decoding', 'async')
    expect(tree).toHaveAttribute('width')
    expect(tree).toHaveAttribute('height')
  })

  it('hangs the water below the heading group, lazily so a phone never fetches it', () => {
    const { container } = render(<HomeHero artistName="Zenon Billings" />)
    const water = container.querySelector('.hero > .brushstroke-layer:last-child > img')!

    expect(water).toHaveClass('brushstroke', 'hero__water')
    expect(water).toHaveAttribute('src', '/brushstrokes/water.webp')
    expect(water).toHaveAttribute('alt', '')
    expect(water).toHaveAttribute('decoding', 'async')
    // React 19 would otherwise preload a plain <img> on every device, and a
    // lazy image with no box (display: none below the breakpoint) is never fetched.
    expect(water).toHaveAttribute('loading', 'lazy')
    expect(water).toHaveAttribute('width')
    expect(water).toHaveAttribute('height')
  })
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd web && npx vitest run tests/components/HomeHero.test.tsx`
Expected: the three new tests FAIL (children are `['']`, no `picture`, no water); the four existing tests still PASS.

- [ ] **Step 4: Write the markup**

Replace `web/components/HomeHero.tsx` with:

```tsx
import BrushstrokeLayer from '@/components/BrushstrokeLayer'
import InitialBadge from '@/components/InitialBadge'
import { brushstrokeWideMediaQuery } from '@/lib/brushstroke/brushstrokeWideBreakpoint'

type HomeHeroProps = {
  artistName: string
  tagline?: string | null
}

// Pixel sizes of the files in public/brushstrokes. They give the browser each
// file's aspect ratio before it loads; the home e2e checks them against the
// files themselves, so a re-export that forgets to update them fails a test.
const TREE = { src: '/brushstrokes/tree.webp', width: 197, height: 281 }
const TREES = { src: '/brushstrokes/trees.webp', width: 565, height: 462 }
const WATER = { src: '/brushstrokes/water.webp', width: 1677, height: 319 }

export default function HomeHero({ artistName, tagline }: HomeHeroProps) {
  return (
    <section className="hero">
      {/* First child, so the layer's static position is the hero's top edge:
          the tree hangs from the header rule. */}
      <BrushstrokeLayer>
        <picture>
          <source
            media={brushstrokeWideMediaQuery()}
            srcSet={TREES.src}
            width={TREES.width}
            height={TREES.height}
          />
          <img
            className="brushstroke hero__tree"
            src={TREE.src}
            width={TREE.width}
            height={TREE.height}
            alt=""
            decoding="async"
          />
        </picture>
      </BrushstrokeLayer>
      <hgroup>
        {/* The attribute tells the header this page already shows the site
            name large, so the header's own wordmark stands down. The header
            knows nothing about which page that is. */}
        <h1 className="hero__wordmark lowercase-chrome" data-site-wordmark="">
          <InitialBadge text={artistName} />
        </h1>
        {tagline && <p className="hero__tagline">{tagline}</p>}
      </hgroup>
      {/* After the heading group, so this layer hangs from the tagline. */}
      <BrushstrokeLayer>
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed static
            file with no renditions to pick from; next/image would add nothing. */}
        <img
          className="brushstroke hero__water"
          src={WATER.src}
          width={WATER.width}
          height={WATER.height}
          alt=""
          decoding="async"
          loading="lazy"
        />
      </BrushstrokeLayer>
    </section>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd web && npx vitest run tests/components/HomeHero.test.tsx && npm run lint`
Expected: PASS (7 tests); lint clean (the tree's `<img>` inside `<picture>` needs no disable, the water's disable is used).

- [ ] **Step 6: Commit**

```bash
git add web/public/brushstrokes web/components/HomeHero.tsx web/tests/components/HomeHero.test.tsx
git commit -m "feat(home): hang the painted tree and water brushstrokes in the hero"
```

---

### Task 4: Styles, driven by the geometry e2e

The stylesheet cannot be unit-tested in jsdom, so the e2e is the red test. It runs against the static export on a private port so it never collides with another worktree's server on 4173.

**Files:**
- Create: `web/tests/e2e/home.spec.ts`
- Modify: `web/styles/_materials.scss` (the layer and brushstroke rules, the contrast hide, the `body` comment)
- Modify: `web/styles/_home.scss` (knob block, hgroup padding move, `.hero__tree`, `.hero__water`, wordmark and tagline `max-width`)
- Create (outside the repo): `/home/matt/.claude/jobs/09744531/tmp/playwright.config.ts`

**Interfaces:**
- Consumes: the DOM from Task 3; `BRUSHSTROKE_WIDE_BREAKPOINT_EM` from Task 1.
- Produces: the custom properties `--brushstroke-tree-top`, `--brushstroke-tree-right`, `--brushstroke-tree-width`, `--brushstroke-water-*`, `--brushstroke-opacity` on `.hero`, read by the e2e via `getComputedStyle`. Task 5 reuses the `open()` helper and the `VIEWPORTS` list from this spec file.

- [ ] **Step 1: Write the private Playwright config (not committed)**

```ts
// /home/matt/.claude/jobs/09744531/tmp/playwright.config.ts
import { defineConfig } from '@playwright/test'

const web = '/home/matt/files/code/zenon-billings/.claude/worktrees/hero-brushstroke/web'
const port = 4187

export default defineConfig({
  testDir: `${web}/tests/e2e`,
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: `npx serve out -l ${port}`,
    cwd: web,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
```

- [ ] **Step 2: Write the failing geometry e2e**

```ts
// web/tests/e2e/home.spec.ts
import { expect, test, type Page } from '@playwright/test'
import { BRUSHSTROKE_WIDE_BREAKPOINT_EM } from '../../lib/brushstroke/brushstrokeWideBreakpoint'

type Box = { x: number; y: number; width: number; height: number }

// The breakpoint is in em of the browser default, which Playwright leaves at 16px.
const WIDE = BRUSHSTROKE_WIDE_BREAKPOINT_EM * 16

// Phones of several widths and heights, the edge of the wide breakpoint, a
// landscape phone, and the widths just below each Pico container step, where
// the wordmark is widest relative to the container and most likely to run
// into the pines. Two heights at 375 prove the tree's place does not depend
// on the hero's height, which is what moved it between phones before.
export const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 375, height: 667 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 430, height: 932 },
  { width: 575, height: 800 },
  { width: 576, height: 800 },
  { width: WIDE - 1, height: 1000 },
  { width: WIDE, height: 1024 },
  { width: 844, height: 390 },
  { width: 971, height: 800 },
  { width: 1024, height: 768 },
  { width: 1279, height: 800 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1535, height: 900 },
  { width: 1536, height: 900 },
  { width: 1878, height: 1269 },
  { width: 1920, height: 1080 },
]

// Fonts swap in after first paint and a <picture> re-selects its file
// asynchronously; measuring before either lands passes on a broken page.
export const open = async (page: Page) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(async () => {
    const shown = Array.from(document.querySelectorAll<HTMLImageElement>('img.brushstroke')).filter(
      (img) => getComputedStyle(img).display !== 'none',
    )
    await Promise.all(shown.map((img) => img.decode()))
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  })
}

// A knob on .hero, in px. Knobs are written in rem or px; anything else is a
// test bug, not a style bug, so it throws.
const knobPx = async (page: Page, name: string) =>
  page.evaluate((property) => {
    const raw = getComputedStyle(document.querySelector('.hero')!).getPropertyValue(property).trim()
    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
    const match = raw.match(/^(-?[\d.]+)(rem|px)$/)
    if (!match) throw new Error(`${property} is "${raw}", expected <n>rem or <n>px`)
    return match[2] === 'rem' ? Number(match[1]) * rootPx : Number(match[1])
  }, name)

const box = async (page: Page, selector: string): Promise<Box> =>
  (await page.locator(selector).first().boundingBox())!

const clientWidth = (page: Page) => page.evaluate(() => document.documentElement.clientWidth)

for (const viewport of VIEWPORTS) {
  test.describe(`home brushstrokes at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport })

    test('hang from the header rule, in the screen corner, without widening the page', async ({
      page,
    }) => {
      await open(page)
      const rule = await box(page, '.site-header__rule')
      const tree = await box(page, '.hero__tree')
      const width = await clientWidth(page)

      // Anchored to the rule by the knob, never to the hero's height.
      const top = await knobPx(page, '--brushstroke-tree-top')
      expect(Math.abs(tree.y - (rule.y + rule.height + top))).toBeLessThanOrEqual(1)

      // In the corner by the knob, whatever the container is doing.
      const right = await knobPx(page, '--brushstroke-tree-right')
      expect(Math.abs(width - (tree.x + tree.width) - right)).toBeLessThanOrEqual(1)

      // The layer clips its own bleed; the document never scrolls sideways.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)

      // Every layer spans the viewport: nothing between it and the root is a
      // containing block.
      for (const layer of await page.locator('.brushstroke-layer').all()) {
        const layerBox = (await layer.boundingBox())!
        expect(Math.abs(layerBox.x)).toBeLessThanOrEqual(1)
        expect(Math.abs(layerBox.width - width)).toBeLessThanOrEqual(1)
      }
    })

    test('paint under the paper grain: no ancestor traps them', async ({ page }) => {
      await open(page)
      const offenders = await page.evaluate(() => {
        const found: string[] = []
        for (const brushstroke of document.querySelectorAll('.brushstroke')) {
          let node = brushstroke.parentElement
          while (node && node !== document.body) {
            const style = getComputedStyle(node)
            const isLayer = node.classList.contains('brushstroke-layer')
            const problems = [
              !isLayer && style.position !== 'static' && 'position',
              style.zIndex !== 'auto' && 'z-index',
              style.transform !== 'none' && 'transform',
              style.translate !== 'none' && 'translate',
              style.filter !== 'none' && 'filter',
              style.opacity !== '1' && 'opacity',
              style.isolation !== 'auto' && 'isolation',
              style.mixBlendMode !== 'normal' && 'mix-blend-mode',
              style.contain !== 'none' && 'contain',
              style.containerType !== 'normal' && 'container-type',
              style.willChange !== 'auto' && 'will-change',
              style.clipPath !== 'none' && 'clip-path',
              style.maskImage !== 'none' && 'mask-image',
              style.perspective !== 'none' && 'perspective',
            ].filter(Boolean)
            if (problems.length) found.push(`${node.tagName}.${node.className}: ${problems.join(', ')}`)
            node = node.parentElement
          }
        }
        return found
      })
      expect(offenders).toEqual([])
    })

    test('show the phone tree below the wide breakpoint and the pines and water from it', async ({
      page,
    }) => {
      const requests: string[] = []
      page.on('request', (request) => requests.push(request.url()))
      await open(page)

      const tree = page.locator('.hero__tree')
      const water = page.locator('.hero__water')
      const currentSrc = await tree.evaluate((img: HTMLImageElement) => img.currentSrc)

      if (viewport.width < WIDE) {
        expect(currentSrc.endsWith('/brushstrokes/tree.webp')).toBe(true)
        await expect(water).toBeHidden()
        expect(requests.some((url) => url.includes('water.webp'))).toBe(false)
      } else {
        expect(currentSrc.endsWith('/brushstrokes/trees.webp')).toBe(true)
        await expect(water).toBeVisible()

        // Hangs from the tagline (or the wordmark, when Sanity has no tagline).
        const anchor = (await page.locator('.hero__tagline').count())
          ? await box(page, '.hero__tagline')
          : await box(page, '.hero__wordmark')
        const waterBox = await box(page, '.hero__water')
        const top = await knobPx(page, '--brushstroke-water-top')
        expect(Math.abs(waterBox.y - (anchor.y + anchor.height + top))).toBeLessThanOrEqual(1)

        // Its width follows its knob, not Pico's img { max-width: 100% }.
        const widthKnob = await page.evaluate(() =>
          getComputedStyle(document.querySelector('.hero')!).getPropertyValue('--brushstroke-water-width').trim(),
        )
        const vw = Number(widthKnob.match(/^([\d.]+)vw$/)![1])
        expect(Math.abs(waterBox.width - (vw / 100) * viewport.width)).toBeLessThanOrEqual(2)
      }

      // Each rendered file is the one the markup describes, at the size it claims.
      const mismatches = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLImageElement>('img.brushstroke'))
          .filter((img) => getComputedStyle(img).display !== 'none')
          .filter(
            (img) =>
              !img.complete ||
              img.naturalWidth !== Number(img.getAttribute('width')) ||
              img.naturalHeight !== Number(img.getAttribute('height')),
          )
          .map((img) => `${img.currentSrc}: ${img.naturalWidth}x${img.naturalHeight}`),
      )
      expect(mismatches).toEqual([])
    })
  })
}

test('brushstrokes give way to a request for more contrast, like the grain', async ({ page }) => {
  await page.emulateMedia({ contrast: 'more' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  for (const brushstroke of await page.locator('.brushstroke').all()) {
    await expect(brushstroke).toBeHidden()
  }
})
```

- [ ] **Step 3: Build the export and run the e2e to verify it fails**

```bash
cd web && npm run build 2>&1 | tail -3
npx playwright test --config /home/matt/.claude/jobs/09744531/tmp/playwright.config.ts tests/e2e/home.spec.ts 2>&1 | tail -20
```

Expected: the build succeeds; the e2e FAILS on every viewport (the brushstrokes are unstyled: `--brushstroke-tree-top` is empty so `knobPx` throws, the images sit in flow).

- [ ] **Step 4: Write the material rules**

In `web/styles/_materials.scss`, extend the `body` comment and add the rules after `.paper-sheet--deckle`:

Replace the `body {` comment's first line

```scss
  // Gives `body::before` its own local stacking context. Without it, `body`'s own background is an ordinary in-flow box painted
```

with

```scss
  // Gives `body::before` its own local stacking context. The brushstrokes
  // (below) depend on this too: they sit at z-index -2 in the same context,
  // under the grain at -1. Without it, `body`'s own background is an ordinary in-flow box painted
```

and add after the `.paper-sheet--deckle` rule:

```scss
// The artist's painted brushstrokes. A layer is a zero-height, viewport-wide
// band that clips its own horizontal overflow, so a brushstroke can hang off
// the screen's edge without a horizontal scrollbar and without any overflow
// rule on html or body. `top: auto` is the layer's static position: it hangs
// from whatever precedes it in flow. `clip` is the one overflow value that
// pairs with `visible` on the other axis and creates no scroll container and
// no stacking context. `inset-inline: 0` resolves against the initial
// containing block, the viewport minus any scrollbar, only while no ancestor
// is positioned, transformed, filtered or contained; the home e2e walks the
// ancestors to keep it that way.
.brushstroke-layer {
  position: absolute;
  inset-inline: 0;
  height: 0;
  overflow-x: clip;
  overflow-y: visible;
  pointer-events: none;
}

// Under body::before (the grain, at -1) and above the paper, so the pigment
// reads as in the paper, and it can never cover text. Pico caps every img at
// 100% of its container; a brushstroke's width is its own business.
.brushstroke {
  position: absolute;
  display: block;
  max-width: none;
  height: auto;
  z-index: -2;
  opacity: var(--brushstroke-opacity, 1);
  // No long-press "save image" on a phone, no drag ghost on a desktop.
  pointer-events: none;
  user-select: none;
}
```

and change the `prefers-contrast` block at the end to:

```scss
// Texture is the first thing to go when someone has asked for more contrast.
@media (prefers-contrast: more) {
  body::before,
  .brushstroke {
    display: none;
  }
}
```

- [ ] **Step 5: Write the composition in `_home.scss`**

Replace the `.hero`, `.hero__wordmark` and `.hero__tagline` rules with:

```scss
.hero {
  // Owner knobs. Where the brushstrokes sit and how big and strong they are is
  // set here and nowhere else; every value hot-reloads. Lengths are relative
  // to the viewport (vw) rather than the container so the text rules below can
  // reuse them. The mockup measurements are in the 2026-09-24 spec.
  --brushstroke-opacity: 1;
  // The mockup's share of a phone, capped so a landscape phone does not get a
  // 400px tree.
  --brushstroke-tree-width: min(52.5vw, 16rem);
  // Negative rises above the header rule.
  --brushstroke-tree-top: -1rem;
  // Gap from the screen's right edge.
  --brushstroke-tree-right: 0px;
  // Share of the tree's width the wordmark may run into: the faint haze along
  // both files' left edge.
  --brushstroke-tree-haze: 0.15;
  --brushstroke-water-width: 89vw;
  // From the screen's left edge.
  --brushstroke-water-left: 8.5vw;
  // Below the tagline.
  --brushstroke-water-top: 1rem;

  // The tree's left edge measured from the text's own left edge. `100%` is the
  // width of the box using this value, which for the wordmark and the tagline
  // is the hero's content width; half the difference to the viewport is the
  // gutter beside the text.
  --brushstroke-tree-left: calc(
    (100vw + 100%) / 2 - var(--brushstroke-tree-right) - var(--brushstroke-tree-width)
  );

  @media (min-width: $brushstroke-wide-breakpoint) {
    // Grows to the file's native width and stops.
    --brushstroke-tree-width: clamp(18rem, 30vw, 565px);
    --brushstroke-tree-right: 1.5rem;
  }

  // Pulled up by Pico's <main> block padding so the band starts at the header
  // rule instead of leaving a strip of bare paper. The top padding that keeps
  // the wordmark where it was sits on the heading group instead, so the hero's
  // content box starts exactly at the rule and the first brushstroke layer
  // hangs from it. The bottom padding takes over the heading group's Pico
  // margin, zeroed below so the second layer hangs from the tagline itself.
  margin-top: calc(var(--pico-block-spacing-vertical) * -1);
  padding-block: 0 calc(var(--space-band) + var(--pico-typography-spacing-vertical));
}

.hero > hgroup {
  padding-top: calc(clamp(2rem, 7vw, 5rem) + var(--pico-block-spacing-vertical));
  margin-bottom: 0;
}

.hero__tree {
  top: var(--brushstroke-tree-top);
  right: var(--brushstroke-tree-right);
  width: var(--brushstroke-tree-width);
}

.hero__water {
  display: none;
  top: var(--brushstroke-water-top);
  left: var(--brushstroke-water-left);
  width: var(--brushstroke-water-width);

  @media (min-width: $brushstroke-wide-breakpoint) {
    display: block;
  }
}

.hero__wordmark {
  font-size: clamp(2.4rem, 7.2vw, 5.6rem);
  font-weight: 600;
  line-height: 0.95;
  // Matches the badge's right padding so every letter gap in the name is even.
  letter-spacing: 0.15em;
  margin: 0;
  // Wraps rather than running under the pines: the name may reach into the
  // tree's faint left edge by the haze share, no further.
  max-width: min(
    14ch,
    calc(var(--brushstroke-tree-left) + var(--brushstroke-tree-width) * var(--brushstroke-tree-haze))
  );
}

.hero__tagline {
  margin-top: 1.25rem;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--ink-muted);
  // Wraps short of the tree: muted ink cannot stay legible over pigment.
  max-width: min(40ch, var(--brushstroke-tree-left));
}
```

- [ ] **Step 6: Rebuild and run the e2e to verify it passes**

```bash
cd web && npm run build 2>&1 | tail -3
npx playwright test --config /home/matt/.claude/jobs/09744531/tmp/playwright.config.ts tests/e2e/home.spec.ts 2>&1 | tail -20
```

Expected: PASS at every viewport. If the corner or anchor check is off by more than 1 px at some width, the cause is a half-pixel in the tree's own box; widen that tolerance to 1.5, never the rule.

- [ ] **Step 7: Look at it**

```bash
cd web && node -e '
const { chromium } = require("@playwright/test")
;(async () => {
  const browser = await chromium.launch()
  for (const [w, h] of [[375, 667], [768, 1024], [1280, 800], [1878, 1269]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.goto("http://localhost:4187/")
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(500)
    await page.screenshot({ path: `/home/matt/.claude/jobs/09744531/tmp/home-${w}.png` })
  }
  await browser.close()
})()'
```

Open each PNG with the Read tool and compare with the mockups. Check the trees file's left and bottom edges and the water's top edge for straight lines (spec D7). If an edge shows, add to `.hero__tree` or `.hero__water` in `_home.scss`, wide block only:

```scss
    // The export is cropped through the haze; feather the cut edge.
    mask-image:
      linear-gradient(to right, transparent, #000 6%),
      linear-gradient(to top, transparent, #000 6%);
    mask-composite: intersect;
```

and rerun Step 6 (a mask on the image itself is allowed; the ancestor walk still passes).

- [ ] **Step 8: Run the whole existing suite and the gates**

```bash
cd web && npx vitest run 2>&1 | tail -5
npx playwright test --config /home/matt/.claude/jobs/09744531/tmp/playwright.config.ts 2>&1 | tail -8
npx tsc --noEmit && npm run lint && npx prettier --check . 2>&1 | tail -3
```

Expected: all green. `layout.spec.ts` and `header.spec.ts` are unchanged and still pass (the wordmark did not move; the rule did not move).

- [ ] **Step 9: Commit**

```bash
git add web/styles/_materials.scss web/styles/_home.scss web/tests/e2e/home.spec.ts
git commit -m "feat(home): position the brushstrokes from the rule, the tagline and the screen edge"
```

---

### Task 5: Legibility, measured

**Files:**
- Create: `web/tests/e2e/brushstrokeLegibility.ts`
- Modify: `web/tests/e2e/home.spec.ts` (one more test per viewport)
- Modify (only if a check fails): `web/styles/_home.scss` knob values

**Interfaces:**
- Consumes: `open`, `VIEWPORTS` from `home.spec.ts`.
- Produces: `minContrastUnder(page, selector): Promise<{ text: string; minContrast: number; pixels: number }[]>` and `contrastRatio(a: Rgb, b: Rgb): number`.

- [ ] **Step 1: Write the helper**

```ts
// web/tests/e2e/brushstrokeLegibility.ts
import type { Page } from '@playwright/test'

export type Rgb = readonly [red: number, green: number, blue: number]

// The page's rendered ground: flat --paper-cold-press under the grain at 50%
// multiply, as measured for the README's contrast table.
export const PAPER: Rgb = [241, 237, 230]

const channel = (value: number) => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

// WCAG 2 contrast ratio, 1 to 21.
export const contrastRatio = (a: Rgb, b: Rgb) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

export type Legibility = { text: string; minContrast: number; pixels: number }

// The lowest contrast between an element's ink and what is painted beneath its
// glyph lines, with every visible brushstroke composited over flat paper in a
// canvas at its rendered box and opacity. No screenshot and no grain: the
// grain nudges single pixels either way and is already in PAPER on average;
// what this measures is the pigment alone. The luminance maths is repeated
// inside the page because evaluate() cannot see this module's functions.
export const minContrastUnder = (page: Page, selector: string): Promise<Legibility[]> =>
  page.evaluate(
    ([selector, paper]) => {
      const channel = (value: number) => {
        const c = value / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      }
      const luminance = (r: number, g: number, b: number) =>
        0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
      const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)

      const root = document.documentElement
      const canvas = new OffscreenCanvas(root.scrollWidth, root.scrollHeight)
      const context = canvas.getContext('2d')!
      context.fillStyle = `rgb(${paper.join(',')})`
      context.fillRect(0, 0, canvas.width, canvas.height)
      for (const img of document.querySelectorAll<HTMLImageElement>('img.brushstroke')) {
        if (getComputedStyle(img).display === 'none') continue
        const rect = img.getBoundingClientRect()
        context.globalAlpha = Number(getComputedStyle(img).opacity)
        context.drawImage(img, rect.left + scrollX, rect.top + scrollY, rect.width, rect.height)
      }

      return Array.from(document.querySelectorAll<HTMLElement>(selector)).map((element) => {
        const [r, g, b] = getComputedStyle(element).color.match(/\d+/g)!.map(Number)
        const ink = luminance(r, g, b)
        const range = document.createRange()
        range.selectNodeContents(element)
        const rects = element.textContent?.trim()
          ? Array.from(range.getClientRects())
          : [element.getBoundingClientRect()]
        let minContrast = Infinity
        let pixels = 0
        for (const rect of rects) {
          const w = Math.ceil(rect.width)
          const h = Math.ceil(rect.height)
          if (!w || !h) continue
          const data = context.getImageData(
            Math.floor(rect.left + scrollX),
            Math.floor(rect.top + scrollY),
            w,
            h,
          ).data
          for (let i = 0; i < data.length; i += 4) {
            const c = contrast(luminance(data[i], data[i + 1], data[i + 2]), ink)
            if (c < minContrast) minContrast = c
            pixels++
          }
        }
        return { text: element.textContent!.trim(), minContrast, pixels }
      })
    },
    [selector, paper] as const,
  )
```

- [ ] **Step 2: Add the failing legibility test to `home.spec.ts`**

Add the import at the top:

```ts
import { contrastRatio, minContrastUnder, PAPER } from './brushstrokeLegibility'
```

Add inside the `test.describe` loop, after the art-direction test:

```ts
    // Text bends nothing: when ink sits over pigment, the pigment or the line
    // length gives way. 4.5:1 for body text, 3:1 for large text and icons.
    test('leave every piece of text over them legible', async ({ page }) => {
      await open(page)

      // The helper's own sanity check: muted ink on bare paper is the README's 4.61:1.
      expect(contrastRatio([0x6e, 0x6a, 0x63], PAPER)).toBeCloseTo(4.61, 1)

      const checks: Array<{ selector: string; floor: number; when?: () => Promise<boolean> }> = [
        { selector: '.hero__wordmark', floor: 3 },
        { selector: '.hero__tagline', floor: 4.5 },
        { selector: '.home-featured h2', floor: 3 },
        {
          selector: '.site-header__links a',
          floor: 4.5,
          when: () => page.locator('.site-header__links').isVisible(),
        },
        {
          selector: '.site-header__menu-toggle',
          floor: 3,
          when: () => page.locator('.site-header__menu-toggle').isVisible(),
        },
      ]

      for (const check of checks) {
        if (check.when && !(await check.when())) continue
        const results = await minContrastUnder(page, check.selector)
        for (const result of results) {
          expect(result.pixels, `${check.selector} "${result.text}" measured nothing`).toBeGreaterThan(0)
          expect(
            result.minContrast,
            `${check.selector} "${result.text}" at ${viewport.width}px`,
          ).toBeGreaterThanOrEqual(check.floor)
        }
      }
    })
```

- [ ] **Step 3: Run it to verify it fails, or learn that it passes**

Run: `cd web && npx playwright test --config /home/matt/.claude/jobs/09744531/tmp/playwright.config.ts tests/e2e/home.spec.ts -g legible 2>&1 | tail -30`

Expected: with Task 4's rules the tagline and wordmark should already clear the tree and the trees should clear the nav, so this may pass first time. If it does, that is the test proving the Task 4 text rules; write down the minimum contrast per element at 375 and 1878 from a `console.log` of `results` and move on. If it fails, read which element and width, then fix in this order without touching the text colour:

1. `--brushstroke-tree-haze` down (wordmark), or `--brushstroke-tree-right`/`-width` for that breakpoint.
2. `--brushstroke-tree-top` if the nav is hit.
3. `--brushstroke-opacity` last.

Rebuild (`npm run build`) after every SCSS change; the e2e reads `out/`.

- [ ] **Step 4: Run the whole suite**

```bash
cd web && npx playwright test --config /home/matt/.claude/jobs/09744531/tmp/playwright.config.ts 2>&1 | tail -8
npx tsc --noEmit && npm run lint && npx prettier --check . 2>&1 | tail -3
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add web/tests/e2e/brushstrokeLegibility.ts web/tests/e2e/home.spec.ts web/styles/_home.scss
git commit -m "test(home): measure the ink over every brushstroke against the contrast floor"
```

---

### Task 6: Documentation

**Files:**
- Modify: `README.md` (rule 2, "Where to change what", a "Brushstroke assets" section, the palette note)
- Modify: `docs/superpowers/specs/2026-09-01-studio-pigment-design.md` (one line at the "text never sits directly on a bloom" rule)
- Modify: `docs/superpowers/specs/2026-09-24-hero-brushstroke-design.md` (status line; record the final knob values and the measured minimum contrasts)

- [ ] **Step 1: README rule 2**

Replace

```markdown
2. **Texture, not decoration.** The paper grain and the ink rules are the whole surface
   vocabulary. There are no wash blooms; the spec's one-per-viewport rule is now zero.
```

with

```markdown
2. **Texture, not decoration.** The surface vocabulary is the paper grain, the ink rules,
   and the artist's own painted brushstrokes: the work itself, never an imitation of it.
   There are no synthetic washes or blooms. Brushstrokes sit under the grain, in a page's
   opening band, at most two per viewport, and never where they pull text below the
   contrast floor (the home e2e measures it).
```

- [ ] **Step 2: README "Where to change what"**

Replace the materials row and add two rows plus a footnote:

```markdown
| Change                                                    | File                                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------------------- |
| A colour, spacing value, or the mat ratio[^1]             | `web/styles/_tokens.scss`                                                   |
| How big a gallery card can grow[^2]                       | `web/styles/_tokens.scss`                                                   |
| Type scale, the studio label, or the name badge           | `web/styles/_typography.scss`                                               |
| Paper texture, ink rules, deckle edge, how brushstrokes are layered and clipped | `web/styles/_materials.scss`                           |
| Where the home brushstrokes sit, how big and strong they are[^3] | `web/styles/_home.scss` (the knob block on `.hero`)                  |
| Swap a brushstroke's file                                 | `web/public/brushstrokes/`, plus its `width`/`height` in `web/components/HomeHero.tsx` |
| Anything specific to one page                             | `web/styles/_<area>.scss`                                                   |
```

```markdown
[^3]: `$brushstroke-wide-breakpoint` (where the phone tree gives way to the pines and the
    water) is mirrored by `BRUSHSTROKE_WIDE_BREAKPOINT_EM` in
    `web/lib/brushstroke/brushstrokeWideBreakpoint.ts`, which the `<picture>` uses to
    switch files. A unit test fails if they differ.
```

Run `npx prettier --write README.md` afterwards so the table columns realign.

- [ ] **Step 3: README "Brushstroke assets" section**

Add after the "Palette" section:

```markdown
### Brushstroke assets

The home page's tree and water are the artist's own watercolour marks, exported with
transparency. The lossless masters and their upgrade notes live outside the repository
(`/mnt/d/files/pictures/art_by_dad/assets/`); the site ships lossy copies made from them
with `sharp`, which Next.js already installs:

```bash
cd web && node -e '
const sharp = require("sharp")
const dir = "/mnt/d/files/pictures/art_by_dad/assets/"
for (const name of ["brushstroke_tree", "brushstroke_trees_desktop", "brushstroke_water"]) {
  sharp(dir + name + ".webp")
    .webp({ quality: 80, alphaQuality: 100, effort: 6 })
    .toFile(dir + name + "_q80.webp")
}'
```

Copy the `_q80` results to `web/public/brushstrokes/` as `tree.webp`, `trees.webp` and
`water.webp`, and update the pixel sizes in `web/components/HomeHero.tsx` if they changed.
The alpha channel stays lossless; only the colour is compressed. Text over a brushstroke is
measured against the contrast floor by `web/tests/e2e/home.spec.ts`, so a heavier export
can fail a test rather than a reader.
```

- [ ] **Step 4: README palette note**

Find the sentence in the Palette section that says the measured composite "is what text outside a `.paper-sheet` sits on" and append: ", except over a brushstroke on the home page, where the e2e suite measures the ink against the pigment beneath it."

- [ ] **Step 5: Studio-pigment spec note**

At the line containing "Text never sits directly on a bloom without a solid backing", append a sentence: "Superseded for the painted brushstrokes by `2026-09-24-hero-brushstroke-design.md`, where the measured contrast check stands in for the backing."

- [ ] **Step 6: Record the outcome in the spec**

In `docs/superpowers/specs/2026-09-24-hero-brushstroke-design.md`, set the status to "Implemented on `worktree-hero-brushstroke`; awaiting owner review" and, under D5, replace any knob value that changed during Task 5 with the shipped one, noting why.

- [ ] **Step 7: Gates and commit**

```bash
cd web && npx prettier --check . && npm run lint && npx vitest run 2>&1 | tail -3
git add README.md docs/superpowers
git commit -m "docs: describe the home brushstrokes, their knobs and their export"
```

---

## Self-review

- **Spec coverage:** D1 (Task 3), D2/D3/D4/D5 (Task 4), D6 (Task 5), D7 (Task 4 step 7), components table (Tasks 1 to 5), tests (Tasks 1 to 5), documentation (Task 6), out of scope untouched.
- **Placeholders:** none; every step carries its code.
- **Type consistency:** `brushstrokeWideMediaQuery()` (Task 1) is what Task 3's `<source media>` and unit test use; `open`/`VIEWPORTS` (Task 4) are what Task 5 imports; `minContrastUnder`/`contrastRatio`/`PAPER` (Task 5 step 1) are what step 2 imports.
- **Review Focus:** items 1, 2, 3, 5 are pinned in Task 4's e2e; item 4 is structural.
