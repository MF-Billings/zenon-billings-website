# Studio / Pigment Visual Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's unstyled Pico defaults with a visual identity derived from the artist's own medium — paper ground, wash blooms, ink rules, and a pigment palette mapped per artwork medium.

**Architecture:** A token layer (`_tokens.scss`) names every value and bridges our palette onto Pico's `--pico-*` custom properties, so Pico's own components inherit the identity. Pico is kept for the reset, base elements, form controls, and focus states, with the modules we fully replace switched off. Six small React components carry the parts that need markup (SVG filters, blooms, rules, labels, chips); everything else is CSS in per-area SCSS partials.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`), TypeScript, Pico.css v2 via SCSS, `next/font` (Archivo + Inter), Vitest + Testing Library, Playwright, Prettier, ESLint.

**Spec:** `docs/superpowers/specs/2026-09-01-studio-pigment-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **All paths in this plan are relative to `web/`** unless stated otherwise. Run every `npm` command from `web/`.
- **Never add dependencies at the repository root.** `web/` and `studio/` are independent sibling packages.
- **No new npm dependencies at all.** This work adds none. `next/font`, Pico, and Sass are already installed.
- **TDD is mandatory.** RED (failing test) → GREEN (minimal code) → REFACTOR. Never write implementation before a failing test. Where a task is pure CSS and has no meaningful unit test, the task says so explicitly and names its verification instead — do not invent assertions on colour or shadow values.
- **Next.js stays in static export mode.** `output: 'export'`. No route handlers, no server actions, no middleware, no `next/image`.
- **No client-side JavaScript is added by this work.** The sticky placard is CSS, the filter chips are CSS `:has()`, the blooms are static SVG.
- **No inline styles, no CSS-in-JS, no Tailwind.** The card tilt uses `:nth-child()` cycling, not per-element style attributes.
- **Never edit Pico's source** in `node_modules/@picocss/pico`.
- **Test files mirror source structure:** `components/StudioLabel.tsx` → `tests/components/StudioLabel.test.tsx`.
- **Coverage floor is 80%** (lines, functions, branches, statements) and the existing exclusion list in `vitest.config.ts` must not be widened.
- **Prettier config:** no semicolons, single quotes, print width 100, trailing commas. Run `npm run format` before committing if unsure.
- **Prettier and ESLint must pass before every commit:** `npm run lint && npm run format:check`.
- **Comments explain why, never what.** Prefer a better name over a comment.
- **Ubiquitous language:** `artwork`, `tag`, `siteSettings`, `medium`, `slug`. This work adds `pigment`, `paper`, `mat`, `bloom`, `ink rule`, `studio label`, `placard`. Use them consistently.
- **Commit after every task** using Conventional Commit prefixes (`feat:`, `test:`, `chore:`, `docs:`, `fix:`, `style:`).
- **The two design constraints from the spec are non-negotiable:** type stays disciplined (no handwriting faces, no rotated text, ever), and at most one wash bloom is visible per viewport.
- **Contrast floor:** every text colour must clear 4.5:1 against `--paper-cold-press` (3:1 for display sizes ≥ 24px). The palette bends to the contrast requirement, never the reverse.

## Environment prerequisite

`node_modules` is **not installed** in this worktree. Before Task 1:

```bash
cd web
npm install
cp .env.example .env.local   # if .env.local does not already exist
```

`.env.local` needs `NEXT_PUBLIC_SANITY_PROJECT_ID=nlwxmhc1` and `NEXT_PUBLIC_SANITY_DATASET=development`. Builds fetch from Sanity at build time; without these the build fails before any of this work is visible.

For Task 15 only, Playwright browsers are also needed: `npx playwright install chromium`.

---

## File Structure

**Created — components:**

| File | Responsibility |
|---|---|
| `lib/artwork/pigmentForMedium.ts` | Maps an artwork medium to a pigment name. Pure function, no React. |
| `components/PaperDefs.tsx` | The single copy of every SVG `<filter>` definition, rendered once in the root layout. |
| `components/WashBloom.tsx` | One decorative pigment bloom. |
| `components/InkRule.tsx` | One drawn horizontal divider. |
| `components/StudioLabel.tsx` | `2024 · watercolour · 30 × 40 cm` — the recurring metadata line. |
| `components/MediumChip.tsx` | A medium name rendered in its own pigment. |

**Created — styles** (`styles/` is a flat set of partials; `style.scss` is the only entry point):

| File | Responsibility |
|---|---|
| `_tokens.scss` | Pigments, paper, spacing, medium mapping, and the `--pico-*` bridge. The only file that knows Pico's variable names. |
| `_typography.scss` | Font family wiring, fluid type scale, studio label, drop cap. |
| `_materials.scss` | Paper grain, paper sheets, blooms, ink rules, deckle edge, reduced-motion and high-contrast overrides. |
| `_header.scss` | Site header and footer. |
| `_home.scss` | Home hero. |
| `_gallery.scss` | Filter bar, chips, grid stagger. |
| `_artwork.scss` | Artwork card, mat, tilt, detail placard. |
| `_about.scss` | About spread. |
| `_contact.scss` | Contact sheet. |
| `_forms.scss` | Ruled-line inputs and pigment buttons, shared by gallery search and contact form. |

**Created — tests:** one mirror per new component, plus `tests/e2e/layout.spec.ts` (the directory does not exist yet).

**Modified:** `app/layout.tsx`, `app/page.tsx`, `app/gallery/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`, `app/artwork/[slug]/page.tsx`, `components/ArtworkCard.tsx`, `components/ArtworkGrid.tsx`, `components/GalleryBrowser.tsx`, `components/SiteHeader.tsx`, `components/SiteFooter.tsx`, `components/ContactAliasLink.tsx`, `styles/style.scss`, and the corresponding test files. Documentation: `AGENTS.md`, `README.md`.

---

## Task 1: Token layer, fonts, and the partials structure

Establishes the foundation everything else builds on: named values, the two typefaces, and the split of `style.scss` into partials. No visual flourish yet beyond the paper ground — that is deliberate, so a reviewer can judge the foundation on its own.

**Files:**
- Create: `styles/_tokens.scss`, `styles/_typography.scss`
- Modify: `styles/style.scss`, `app/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS custom properties consumed by every later task — `--paper-cold-press`, `--paper-sheet-surface`, `--pigment-payne-grey`, `--pigment-burnt-sienna`, `--pigment-indigo`, `--pigment-raw-umber`, `--ink-primary`, `--ink-muted`, `--medium-watercolour`, `--medium-drawing`, `--medium-photography`, `--medium-other`, `--space-band`, `--space-sheet`, `--mat-inset`, `--edge-tilt`, `--card-ratio`, `--font-display`, `--font-body`. Also the `.studio-label` and `.paper-sheet` classes.

**This task has no unit test.** It is font wiring and custom property declarations; there is no logic to assert on, and asserting on colour values would lock the palette in cement (see Global Constraints). Verification is: the existing suite still passes, the production build succeeds, and the page visibly renders on a warm paper ground in the two new typefaces.

- [ ] **Step 1: Confirm the baseline is green before touching anything**

```bash
cd web
npm test
npm run build
```

Expected: tests pass, build succeeds. If the build fails here, fix the environment (see Environment prerequisite) before continuing — do not start the redesign on a broken baseline.

- [ ] **Step 2: Create the token layer**

Create `styles/_tokens.scss`:

```scss
// Pigments are named for what they are, never for where they are used, so a
// value can be re-used without carrying a page or component name with it.
:root {
  --paper-cold-press: #f7f3ec;
  --paper-sheet-surface: #fbf9f4;

  --pigment-payne-grey: #3d4f5c;
  --pigment-burnt-sienna: #9c5433;
  --pigment-indigo: #2e3a5c;
  --pigment-raw-umber: #6b5b45;

  --ink-primary: #2a3138;
  --ink-muted: #6e6a63;

  --medium-watercolour: var(--pigment-indigo);
  --medium-drawing: var(--pigment-payne-grey);
  --medium-photography: var(--pigment-burnt-sienna);
  --medium-other: var(--pigment-raw-umber);

  --space-band: clamp(3rem, 8vw, 6rem);
  --space-sheet: clamp(1.5rem, 3vw, 2.5rem);
  --mat-inset: clamp(0.75rem, 2vw, 1.25rem);
  --edge-tilt: 0.4deg;
  --card-ratio: 4 / 5;

  // The single seam with Pico. When Pico renames a variable, this block is the
  // only place that has to change.
  --pico-background-color: var(--paper-cold-press);
  --pico-color: var(--ink-primary);
  --pico-muted-color: var(--ink-muted);
  --pico-primary: var(--pigment-indigo);
  --pico-primary-hover: var(--pigment-payne-grey);
  --pico-primary-focus: color-mix(in srgb, var(--pigment-indigo) 25%, transparent);
  --pico-h1-color: var(--ink-primary);
  --pico-h2-color: var(--ink-primary);
  --pico-h3-color: var(--ink-primary);
  --pico-border-radius: 2px;
  --pico-spacing: 1rem;
}
```

- [ ] **Step 3: Create the typography layer**

Create `styles/_typography.scss`:

```scss
body {
  font-family: var(--font-body), system-ui, sans-serif;
  font-size: 1.0625rem;
  line-height: 1.7;
  color: var(--ink-primary);
}

h1,
h2,
h3 {
  font-family: var(--font-display), system-ui, sans-serif;
  font-variation-settings: 'wdth' 125;
  line-height: 1.05;
  text-wrap: balance;
}

h1 {
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  font-weight: 600;
}

h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 500;
}

h3 {
  font-size: 1.125rem;
  font-weight: 500;
  font-variation-settings: 'wdth' 110;
}

// Chrome the code controls is lowercase; artwork titles keep the artist's own
// capitalisation, so this is opt-in rather than a blanket rule on headings.
.lowercase-chrome {
  text-transform: lowercase;
}

p {
  max-width: 68ch;
}

.studio-label {
  font-family: var(--font-body), system-ui, sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  line-height: 1.5;
  color: var(--ink-muted);
  margin: 0;
}
```

- [ ] **Step 4: Rewrite the stylesheet entry point**

Replace the whole of `styles/style.scss` with the entry point below. Every rule that used to live there moves into a partial in a later task; the three that have no later home (`.result-count`, `.profile-image`, `.visually-hidden`) stay here for now and move in Tasks 11, 13, and 6 respectively.

```scss
@use 'pico';

// Project customizations live below this line. Never edit Pico's source.
@use 'tokens';
@use 'typography';

.artwork-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--pico-spacing);
}

.artwork-card {
  margin: 0;

  img {
    width: 100%;
    height: auto;
    display: block;
  }

  h3 {
    margin-bottom: 0;
  }
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--pico-spacing);

  label {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    white-space: nowrap;
  }
}

.result-count {
  color: var(--pico-muted-color);
  font-size: 0.875em;
}

.artwork-tags mark {
  margin-right: 0.25rem;
}

.profile-image {
  max-width: 18rem;
  height: auto;
  border-radius: var(--pico-border-radius);
}

// Off-screen rather than display:none — some bots skip hidden inputs.
.visually-hidden {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
```

Note: `@use 'tokens'` resolves `_tokens.scss` in the same directory. Sass requires `@use` rules to come first, which is why they sit directly under the Pico import.

- [ ] **Step 5: Wire the fonts and force Pico's light theme**

Replace the imports and the `RootLayout` function in `app/layout.tsx`. Leave the `metadata` export exactly as it is.

```tsx
import type { Metadata } from 'next'
import { Archivo, Inter } from 'next/font/google'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import '@/styles/style.scss'

// The width axis is what makes the wordmark wide; without it Archivo loads at
// its default width and the display type loses its whole character.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})
```

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Pico ships an automatic dark theme; watercolour is a light-ground medium,
    // so the light scheme is pinned rather than following the OS.
    <html lang="en" data-theme="light" className={`${archivo.variable} ${inter.variable}`}>
      <body>
        <SiteHeader />
        <main className="container">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Verify**

```bash
npm test
npm run lint && npm run format:check
npm run build
npm run dev
```

Expected: tests pass, lint and format clean, build succeeds. In the browser at `http://localhost:3000`, the background is warm off-white rather than pure white, headings are set in a wide sans, and body text is Inter. If headings still look narrow, the `wdth` axis did not apply — check the `axes: ['wdth']` option and the `font-variation-settings` rule.

- [ ] **Step 7: Commit**

```bash
git add styles/_tokens.scss styles/_typography.scss styles/style.scss app/layout.tsx
git commit -m "feat: add pigment token layer and display typography"
```

---

## Task 2: Trim Pico

Switch off the Pico modules our own layer fully replaces, so we stop shipping CSS we immediately override.

**Files:**
- Modify: `styles/style.scss`

**Interfaces:**
- Consumes: the `@use 'pico'` line from Task 1.
- Produces: nothing new. Later tasks assume Pico no longer styles `nav` or `article` as a card.

**No unit test.** Verification is that the build succeeds and the existing suite stays green.

- [ ] **Step 1: Read the real module names**

The exact keys depend on the installed Pico version, so read them rather than guessing:

```bash
ls node_modules/@picocss/pico/scss/components/
grep -n '\$modules' node_modules/@picocss/pico/scss/settings/_index.scss
```

Expected: a `components/` listing containing files like `_card.scss` and `_nav.scss`, and a `$modules` map default in the settings file. The map keys are paths like `"components/card"`.

- [ ] **Step 2: Disable the two replaced modules**

Change the first line of `styles/style.scss` to configure the import. Use the exact keys observed in Step 1:

```scss
@use 'pico' with (
  $modules: (
    'components/card': false,
    'components/nav': false,
  )
);
```

**If `$modules` does not exist in the installed version**, or the build errors on the `with (...)` clause: revert this line to plain `@use 'pico';`, add a comment recording that the installed version does not support module configuration, and move on. Overriding Pico's card and nav rules in `_artwork.scss` and `_header.scss` still works — this task is a payload optimisation, not a correctness requirement, and it is not worth blocking the redesign over.

- [ ] **Step 3: Verify**

```bash
npm run build
npm test
```

Expected: build succeeds, tests pass. In the browser the header nav will now look unstyled — that is correct, Task 9 restyles it.

- [ ] **Step 4: Commit**

```bash
git add styles/style.scss
git commit -m "chore: disable the Pico modules our own layer replaces"
```

---

## Task 3: Medium-to-pigment mapping

A pure function, and the first real TDD cycle. Every component that colours something by medium goes through it.

**Files:**
- Create: `lib/artwork/pigmentForMedium.ts`
- Test: `tests/lib/artwork/pigmentForMedium.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export type Pigment = 'watercolour' | 'drawing' | 'photography' | 'other'` and `export function pigmentForMedium(medium: string | null | undefined): Pigment`. Tasks 4, 5, 7, and 12 import both.

- [ ] **Step 1: Write the failing test**

Create `tests/lib/artwork/pigmentForMedium.test.ts`:

```ts
import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'

describe('pigmentForMedium', () => {
  it('maps each known medium to its own pigment', () => {
    expect(pigmentForMedium('watercolour')).toBe('watercolour')
    expect(pigmentForMedium('drawing')).toBe('drawing')
    expect(pigmentForMedium('photography')).toBe('photography')
  })

  it('maps the schema’s explicit "other" medium to the fallback pigment', () => {
    expect(pigmentForMedium('other')).toBe('other')
  })

  it('falls back rather than returning an undefined colour for an unknown medium', () => {
    expect(pigmentForMedium('oil')).toBe('other')
  })

  it('falls back when the medium is missing entirely', () => {
    expect(pigmentForMedium(null)).toBe('other')
    expect(pigmentForMedium(undefined)).toBe('other')
  })

  it('ignores casing and surrounding whitespace, which content entry can introduce', () => {
    expect(pigmentForMedium('Watercolour')).toBe('watercolour')
    expect(pigmentForMedium('  drawing ')).toBe('drawing')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/lib/artwork/pigmentForMedium.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/artwork/pigmentForMedium"`.

- [ ] **Step 3: Write the minimal implementation**

Create `lib/artwork/pigmentForMedium.ts`:

```ts
const PIGMENTED_MEDIUMS = ['watercolour', 'drawing', 'photography'] as const

export type Pigment = (typeof PIGMENTED_MEDIUMS)[number] | 'other'

export function pigmentForMedium(medium: string | null | undefined): Pigment {
  const normalized = medium?.trim().toLowerCase()
  const match = PIGMENTED_MEDIUMS.find((pigment) => pigment === normalized)
  return match ?? 'other'
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/lib/artwork/pigmentForMedium.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/artwork/pigmentForMedium.ts tests/lib/artwork/pigmentForMedium.test.ts
git commit -m "feat: map artwork mediums to pigments"
```

---

## Task 4: StudioLabel

The recurring metadata line. Its whole job is degrading gracefully when fields are missing, which makes it the strongest test candidate in this work.

**Files:**
- Create: `components/StudioLabel.tsx`
- Test: `tests/components/StudioLabel.test.tsx`

**Interfaces:**
- Consumes: `pigmentForMedium` (Task 3), `formatDimensions` from `@/lib/artwork/formatDimensions`.
- Produces: `export default function StudioLabel({ artwork, className }: StudioLabelProps)` where `artwork` is `Pick<Artwork, 'yearCreated' | 'medium' | 'dimensions'>`. Tasks 7 and 12 render it. Emits a `<p class="studio-label">` whose medium span carries `data-pigment`.

- [ ] **Step 1: Write the failing test**

Create `tests/components/StudioLabel.test.tsx`. Note the `dimensions` object shape — `{ width, height, unit }`, matching the Sanity schema:

```tsx
import { render, screen } from '@testing-library/react'
import StudioLabel from '@/components/StudioLabel'
import type { Artwork } from '@/lib/sanity/types'

const artwork = {
  yearCreated: 2024,
  medium: 'watercolour',
  dimensions: { width: 30, height: 40, unit: 'cm' },
} as unknown as Artwork

describe('StudioLabel', () => {
  it('reads as a single studio label when every field is present', () => {
    const { container } = render(<StudioLabel artwork={artwork} />)
    expect(container.textContent).toBe('2024 · watercolour · 30 × 40 cm')
  })

  it('drops the year without leaving a stray separator', () => {
    const { container } = render(
      <StudioLabel artwork={{ ...artwork, yearCreated: null } as unknown as Artwork} />,
    )
    expect(container.textContent).toBe('watercolour · 30 × 40 cm')
  })

  it('drops the dimensions without leaving a stray separator', () => {
    const { container } = render(
      <StudioLabel artwork={{ ...artwork, dimensions: null } as unknown as Artwork} />,
    )
    expect(container.textContent).toBe('2024 · watercolour')
  })

  it('shows a lone year on its own', () => {
    const { container } = render(
      <StudioLabel
        artwork={{ yearCreated: 2024, medium: null, dimensions: null } as unknown as Artwork}
      />,
    )
    expect(container.textContent).toBe('2024')
  })

  it('renders nothing at all when there is no metadata to show', () => {
    const { container } = render(
      <StudioLabel
        artwork={{ yearCreated: null, medium: null, dimensions: null } as unknown as Artwork}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('tags the medium with its pigment so it can be coloured', () => {
    render(<StudioLabel artwork={artwork} />)
    expect(screen.getByText('watercolour')).toHaveAttribute('data-pigment', 'watercolour')
  })

  it('tags an unrecognised medium with the fallback pigment', () => {
    render(<StudioLabel artwork={{ ...artwork, medium: 'oil' } as unknown as Artwork} />)
    expect(screen.getByText('oil')).toHaveAttribute('data-pigment', 'other')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/components/StudioLabel.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/components/StudioLabel"`.

- [ ] **Step 3: Write the minimal implementation**

Create `components/StudioLabel.tsx`:

```tsx
import { Fragment, type ReactElement } from 'react'
import { formatDimensions } from '@/lib/artwork/formatDimensions'
import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'
import type { Artwork } from '@/lib/sanity/types'

type StudioLabelProps = {
  artwork: Pick<Artwork, 'yearCreated' | 'medium' | 'dimensions'>
  className?: string
}

export default function StudioLabel({ artwork, className }: StudioLabelProps) {
  const dimensions = formatDimensions(artwork.dimensions ?? null)

  const parts = [
    artwork.yearCreated ? <span key="year">{artwork.yearCreated}</span> : null,
    artwork.medium ? (
      <span key="medium" className="studio-label__medium" data-pigment={pigmentForMedium(artwork.medium)}>
        {artwork.medium}
      </span>
    ) : null,
    dimensions ? <span key="dimensions">{dimensions}</span> : null,
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/components/StudioLabel.test.tsx
```

Expected: PASS, 7 tests. If the separator assertions fail on whitespace, check that the separator span contains exactly `' · '` with one space either side and that no JSX newline is introducing extra whitespace.

- [ ] **Step 5: Style the medium colour**

Append to `styles/_typography.scss`:

```scss
.studio-label__medium {
  color: var(--medium-other);

  &[data-pigment='watercolour'] {
    color: var(--medium-watercolour);
  }

  &[data-pigment='drawing'] {
    color: var(--medium-drawing);
  }

  &[data-pigment='photography'] {
    color: var(--medium-photography);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add components/StudioLabel.tsx tests/components/StudioLabel.test.tsx styles/_typography.scss
git commit -m "feat: add the studio label metadata line"
```

---

## Task 5: MediumChip

**Files:**
- Create: `components/MediumChip.tsx`
- Test: `tests/components/MediumChip.test.tsx`

**Interfaces:**
- Consumes: `pigmentForMedium` (Task 3).
- Produces: `export default function MediumChip({ medium }: { medium: string | null | undefined })`. Task 12 renders it.

- [ ] **Step 1: Write the failing test**

Create `tests/components/MediumChip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import MediumChip from '@/components/MediumChip'

describe('MediumChip', () => {
  it('names the medium', () => {
    render(<MediumChip medium="watercolour" />)
    expect(screen.getByText('watercolour')).toBeInTheDocument()
  })

  it('carries the pigment for the medium', () => {
    render(<MediumChip medium="photography" />)
    expect(screen.getByText('photography')).toHaveAttribute('data-pigment', 'photography')
  })

  it('falls back to a defined pigment for an unrecognised medium', () => {
    render(<MediumChip medium="oil" />)
    expect(screen.getByText('oil')).toHaveAttribute('data-pigment', 'other')
  })

  it('renders nothing when there is no medium', () => {
    const { container } = render(<MediumChip medium={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/components/MediumChip.test.tsx
```

Expected: FAIL — `Failed to resolve import "@/components/MediumChip"`.

- [ ] **Step 3: Write the minimal implementation**

Create `components/MediumChip.tsx`:

```tsx
import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'

export default function MediumChip({ medium }: { medium: string | null | undefined }) {
  if (!medium) return null

  return (
    <span className="medium-chip" data-pigment={pigmentForMedium(medium)}>
      {medium}
    </span>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/components/MediumChip.test.tsx
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add components/MediumChip.tsx tests/components/MediumChip.test.tsx
git commit -m "feat: add the medium chip"
```

---

## Task 6: SVG primitives — PaperDefs, WashBloom, InkRule

Three thin components. Their tests are correspondingly thin: they render, they are hidden from assistive technology, and the filter id is stable — because everything else references it by name.

**Files:**
- Create: `components/PaperDefs.tsx`, `components/WashBloom.tsx`, `components/InkRule.tsx`, `styles/_materials.scss`
- Modify: `app/layout.tsx`, `styles/style.scss`
- Test: `tests/components/PaperDefs.test.tsx`, `tests/components/WashBloom.test.tsx`, `tests/components/InkRule.test.tsx`

**Interfaces:**
- Consumes: `Pigment` (Task 3).
- Produces: `PaperDefs` (no props, rendered once in the layout, defines filter id `bloom-edge`); `WashBloom({ pigment, className })` where `pigment: Pigment`; `InkRule({ className })`. Tasks 9–14 render these.

- [ ] **Step 1: Write the failing tests**

Create `tests/components/PaperDefs.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import PaperDefs from '@/components/PaperDefs'

describe('PaperDefs', () => {
  it('defines the bloom filter under the id everything else references', () => {
    const { container } = render(<PaperDefs />)
    expect(container.querySelector('filter#bloom-edge')).toBeInTheDocument()
  })

  it('is hidden from assistive technology, being purely decorative', () => {
    const { container } = render(<PaperDefs />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
```

Create `tests/components/WashBloom.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import WashBloom from '@/components/WashBloom'

describe('WashBloom', () => {
  it('carries the pigment it was given, so the CSS can colour it', () => {
    const { container } = render(<WashBloom pigment="photography" />)
    expect(container.querySelector('svg')).toHaveAttribute('data-pigment', 'photography')
  })

  it('references the shared bloom filter rather than defining its own', () => {
    const { container } = render(<WashBloom pigment="watercolour" />)
    expect(container.querySelector('[filter="url(#bloom-edge)"]')).toBeInTheDocument()
    expect(container.querySelector('filter')).toBeNull()
  })

  it('is hidden from assistive technology, being purely decorative', () => {
    const { container } = render(<WashBloom pigment="watercolour" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('accepts a placement class from its caller', () => {
    const { container } = render(<WashBloom pigment="drawing" className="hero__bloom" />)
    expect(container.querySelector('svg')).toHaveClass('wash-bloom', 'hero__bloom')
  })
})
```

Create `tests/components/InkRule.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import InkRule from '@/components/InkRule'

describe('InkRule', () => {
  it('draws a rule', () => {
    const { container } = render(<InkRule />)
    expect(container.querySelector('path')).toBeInTheDocument()
  })

  it('is hidden from assistive technology, being decorative rather than a separator', () => {
    const { container } = render(<InkRule />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('accepts a placement class from its caller', () => {
    const { container } = render(<InkRule className="site-header__rule" />)
    expect(container.querySelector('svg')).toHaveClass('ink-rule', 'site-header__rule')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/components/PaperDefs.test.tsx tests/components/WashBloom.test.tsx tests/components/InkRule.test.tsx
```

Expected: FAIL — all three import paths unresolved.

- [ ] **Step 3: Write the minimal implementations**

Create `components/PaperDefs.tsx`:

```tsx
// One copy of every filter definition, rendered once in the root layout.
// Defining these per-bloom would duplicate identical turbulence maps a dozen
// times over, and each one is expensive to rasterise.
export default function PaperDefs() {
  return (
    <svg className="paper-defs" aria-hidden="true" focusable="false" width="0" height="0">
      <defs>
        <filter id="bloom-edge" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
    </svg>
  )
}
```

Create `components/WashBloom.tsx`:

```tsx
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
```

Create `components/InkRule.tsx`:

```tsx
export default function InkRule({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `ink-rule ${className}` : 'ink-rule'}
      viewBox="0 0 1200 8"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0 4.6 C 180 2.1, 360 6.4, 540 4.2 S 900 1.8, 1200 4.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/components/PaperDefs.test.tsx tests/components/WashBloom.test.tsx tests/components/InkRule.test.tsx
```

Expected: PASS, 9 tests total.

- [ ] **Step 5: Create the materials stylesheet**

Create `styles/_materials.scss`:

```scss
.paper-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

// The paper tooth. A tiled turbulence map as a data URI: no network request,
// one composited layer, and the single change that stops the page reading as #fff.
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: multiply;
  background-color: var(--paper-cold-press);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23t)' opacity='0.35'/%3E%3C/svg%3E");
}

body {
  background-color: var(--paper-cold-press);
}

.paper-sheet {
  background: var(--paper-sheet-surface);
  padding: var(--space-sheet);
  box-shadow: 0 1px 2px rgb(42 49 56 / 6%), 0 8px 24px rgb(42 49 56 / 8%);
}

.paper-sheet--deckle {
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200' preserveAspectRatio='none'%3E%3Cpath d='M0 0h1200v1188c-120 10-180-6-300 2s-180 12-300 4-180-14-300-6-180 10-300 2z' fill='%23fff'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
}

.wash-bloom {
  position: absolute;
  z-index: -1;
  pointer-events: none;
  opacity: 0.14;
  color: var(--medium-other);

  &[data-pigment='watercolour'] {
    color: var(--medium-watercolour);
  }

  &[data-pigment='drawing'] {
    color: var(--medium-drawing);
  }

  &[data-pigment='photography'] {
    color: var(--medium-photography);
  }
}

.ink-rule {
  display: block;
  width: 100%;
  height: 8px;
  color: var(--pigment-payne-grey);
  opacity: 0.55;
}

// Off-screen rather than display:none — some bots skip hidden inputs, and a
// display:none checkbox is unreachable by keyboard.
.visually-hidden {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

// Texture is the first thing to go when someone has asked for more contrast.
@media (prefers-contrast: more) {
  body::before {
    display: none;
  }

  .wash-bloom {
    display: none;
  }
}
```

- [ ] **Step 6: Wire the materials in and render PaperDefs once**

In `styles/style.scss`, add `@use 'materials';` directly after `@use 'typography';`, and **delete** the `.visually-hidden` block at the bottom of the file — it now lives in `_materials.scss`, and leaving both would be a duplicate definition.

In `app/layout.tsx`, import `PaperDefs` and render it as the first child of `<body>`:

```tsx
import PaperDefs from '@/components/PaperDefs'
```

```tsx
      <body>
        <PaperDefs />
        <SiteHeader />
        <main className="container">{children}</main>
        <SiteFooter />
      </body>
```

- [ ] **Step 7: Verify**

```bash
npm test
npm run lint && npm run format:check
npm run build
```

Expected: full suite passes, build succeeds. In the browser the paper texture is visible on close inspection and the page still lays out normally.

- [ ] **Step 8: Commit**

```bash
git add components/PaperDefs.tsx components/WashBloom.tsx components/InkRule.tsx \
        tests/components/PaperDefs.test.tsx tests/components/WashBloom.test.tsx \
        tests/components/InkRule.test.tsx styles/_materials.scss styles/style.scss app/layout.tsx
git commit -m "feat: add paper, bloom, and ink rule materials"
```

---

## Task 7: Artwork card as a mounted sheet

The uniform 4:5 mat, the studio label, and the tilt. This is where the mixed-aspect-ratio problem gets solved.

**Files:**
- Modify: `components/ArtworkCard.tsx`, `tests/components/ArtworkCard.test.tsx`, `styles/style.scss`
- Create: `styles/_artwork.scss`

**Interfaces:**
- Consumes: `StudioLabel` (Task 4), `--card-ratio`, `--mat-inset`, `--edge-tilt` (Task 1).
- Produces: the `.artwork-card` structure — `.artwork-card__mat`, `.artwork-card__image`, `.artwork-card__title`. Task 8 positions these in the grid.

- [ ] **Step 1: Correct the test fixture and write the failing tests**

The existing fixture sets `dimensions: '30 x 40 cm'` — a string, where the schema says `{ width, height, unit }`. `StudioLabel` needs the real shape. In `tests/components/ArtworkCard.test.tsx`, change that one line:

```tsx
  dimensions: { width: 30, height: 40, unit: 'cm' },
```

Then add these tests to the existing `describe('ArtworkCard')` block, leaving all five current tests in place:

```tsx
  it('mats the image so every card is the same shape regardless of the artwork', () => {
    const { container } = render(<ArtworkCard artwork={artwork} />)
    expect(container.querySelector('.artwork-card__mat')).toBeInTheDocument()
  })

  it('shows the full studio label, not just the year', () => {
    render(<ArtworkCard artwork={artwork} />)
    expect(screen.getByText('watercolour')).toBeInTheDocument()
    expect(screen.getByText('30 × 40 cm')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/components/ArtworkCard.test.tsx
```

Expected: FAIL — no `.artwork-card__mat` element, and `watercolour` is not in the document.

- [ ] **Step 3: Rewrite the component**

Replace the body of `components/ArtworkCard.tsx`:

```tsx
import Link from 'next/link'
import SanityImage from '@/components/SanityImage'
import StudioLabel from '@/components/StudioLabel'
import type { Artwork } from '@/lib/sanity/types'

type ArtworkCardProps = {
  artwork: Artwork
  priority?: boolean
}

export default function ArtworkCard({ artwork, priority = false }: ArtworkCardProps) {
  return (
    <article className="artwork-card">
      <Link href={`/artwork/${artwork.slug}`} className="artwork-card__link">
        <span className="artwork-card__mat">
          {artwork.image && (
            <SanityImage
              source={artwork.image}
              alt={artwork.altText ?? artwork.title ?? ''}
              widths={[300, 600, 900]}
              sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="artwork-card__image"
            />
          )}
        </span>
        <h3 className="artwork-card__title">{artwork.title}</h3>
        <StudioLabel artwork={artwork} />
      </Link>
    </article>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/components/ArtworkCard.test.tsx
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Style the card**

Create `styles/_artwork.scss`:

```scss
.artwork-card {
  margin: 0;
  transform: rotate(var(--tilt, 0deg));
  transition:
    transform 320ms cubic-bezier(0.22, 0.61, 0.36, 1),
    box-shadow 320ms cubic-bezier(0.22, 0.61, 0.36, 1);

  &:hover,
  &:focus-within {
    transform: rotate(0deg) translateY(-4px);
  }
}

.artwork-card__link {
  display: block;
  text-decoration: none;
  color: inherit;
}

// A uniform mat means a portrait and a panorama occupy the same footprint, so
// rows never come out ragged. The artwork is contained, never cropped.
.artwork-card__mat {
  display: grid;
  place-items: center;
  aspect-ratio: var(--card-ratio);
  padding: var(--mat-inset);
  background: var(--paper-sheet-surface);
  box-shadow: 0 1px 2px rgb(42 49 56 / 8%), 0 10px 24px rgb(42 49 56 / 10%);
}

.artwork-card__image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.artwork-card__title {
  margin: 0.75rem 0 0.25rem;
}
```

- [ ] **Step 6: Wire it in and remove the superseded rules**

In `styles/style.scss`: add `@use 'artwork';` after `@use 'materials';`, and **delete** the old `.artwork-card` block (the one with the nested `img` and `h3` rules) — `_artwork.scss` replaces it, and the old `img { width: 100% }` rule would defeat the mat's `object-fit: contain`.

- [ ] **Step 7: Verify**

```bash
npm test
npm run build
npm run dev
```

Expected: all tests pass. In the browser, cards are uniform 4:5 rectangles with the artwork centred and matted; no card is cropped and no row is ragged. The tilt is not visible yet — `--tilt` is set per position in Task 8.

- [ ] **Step 8: Commit**

```bash
git add components/ArtworkCard.tsx tests/components/ArtworkCard.test.tsx styles/_artwork.scss styles/style.scss
git commit -m "feat: mat artwork cards to a uniform ratio"
```

---

## Task 8: Grid stagger and tilt

**Files:**
- Modify: `styles/_gallery.scss` (created here), `styles/style.scss`

**Interfaces:**
- Consumes: `.artwork-grid` (existing), `--edge-tilt` (Task 1), `.artwork-card` (Task 7).
- Produces: the `--tilt` custom property, set per grid position.

**No unit test.** This is positional CSS; the meaningful check is the Playwright overflow test in Task 15, which exists precisely because rotation and offsets are what cause accidental horizontal scrollbars.

- [ ] **Step 1: Create the gallery stylesheet with the grid rules**

Create `styles/_gallery.scss`:

```scss
.artwork-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--space-sheet);
  align-items: start;
}

// Sheets pinned to a wall are never perfectly square to each other. The cycle is
// positional rather than random so it stays identical between renders.
.artwork-grid > :nth-child(4n + 1) {
  --tilt: var(--edge-tilt);
}

.artwork-grid > :nth-child(4n + 2) {
  --tilt: calc(var(--edge-tilt) * -0.75);
}

.artwork-grid > :nth-child(4n + 3) {
  --tilt: calc(var(--edge-tilt) * 0.6);
}

.artwork-grid > :nth-child(4n + 4) {
  --tilt: calc(var(--edge-tilt) * -1);
}

// Vertical only: a horizontal offset would push the outer column past the
// container and produce a horizontal scrollbar.
@media (min-width: 768px) {
  .artwork-grid > :nth-child(even) {
    margin-block-start: var(--space-sheet);
  }
}
```

- [ ] **Step 2: Wire it in and remove the superseded rule**

In `styles/style.scss`: add `@use 'gallery';` after `@use 'artwork';`, and **delete** the old `.artwork-grid` block.

- [ ] **Step 3: Verify**

```bash
npm test
npm run build
npm run dev
```

Expected: tests pass. In the browser, cards sit at slight alternating angles, even-numbered cards drop by one gap on desktop, and — check this explicitly — the page has **no horizontal scrollbar** at any width. Drag the window narrow to confirm.

- [ ] **Step 4: Commit**

```bash
git add styles/_gallery.scss styles/style.scss
git commit -m "feat: stagger and tilt the artwork grid"
```

---

## Task 9: Header and footer

**Files:**
- Modify: `components/SiteHeader.tsx`, `components/SiteFooter.tsx`, `styles/style.scss`
- Create: `styles/_header.scss`
- Test: `tests/components/SiteHeader.test.tsx`, `tests/components/SiteFooter.test.tsx` (both exist; add to them)

**Interfaces:**
- Consumes: `InkRule` (Task 6), `.studio-label` and `.lowercase-chrome` (Task 1).
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the failing tests**

Add to the existing `describe('SiteHeader')` block in `tests/components/SiteHeader.test.tsx`:

```tsx
  it('marks the wordmark as chrome, which is what makes it lowercase', () => {
    const { container } = render(<SiteHeader />)
    expect(container.querySelector('.site-header__wordmark')).toHaveClass('lowercase-chrome')
  })

  it('draws the rule beneath the nav', () => {
    const { container } = render(<SiteHeader />)
    expect(container.querySelector('.ink-rule')).toBeInTheDocument()
  })
```

Add to the existing `describe('SiteFooter')` block in `tests/components/SiteFooter.test.tsx`:

```tsx
  it('draws the rule above the footer text', () => {
    const { container } = render(<SiteFooter />)
    expect(container.querySelector('.ink-rule')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- tests/components/SiteHeader.test.tsx tests/components/SiteFooter.test.tsx
```

Expected: FAIL — no `.site-header__wordmark`, no `.ink-rule`.

- [ ] **Step 3: Rewrite the components**

Replace `components/SiteHeader.tsx`:

```tsx
import Link from 'next/link'
import InkRule from '@/components/InkRule'

export default function SiteHeader() {
  return (
    <header className="site-header container">
      <nav className="site-header__nav">
        <Link href="/" className="site-header__wordmark lowercase-chrome">
          Zenon Billings
        </Link>
        <ul className="site-header__links">
          <li>
            <Link href="/gallery" className="lowercase-chrome">
              Gallery
            </Link>
          </li>
          <li>
            <Link href="/about" className="lowercase-chrome">
              About
            </Link>
          </li>
          <li>
            <Link href="/contact" className="lowercase-chrome">
              Contact
            </Link>
          </li>
        </ul>
      </nav>
      <InkRule className="site-header__rule" />
    </header>
  )
}
```

Replace `components/SiteFooter.tsx`:

```tsx
import InkRule from '@/components/InkRule'

export default function SiteFooter() {
  return (
    <footer className="site-footer container">
      <InkRule className="site-footer__rule" />
      <p className="studio-label">&copy; {new Date().getFullYear()} Zenon Billings</p>
    </footer>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/components/SiteHeader.test.tsx tests/components/SiteFooter.test.tsx
```

Expected: PASS. The pre-existing tests — three nav links, the `navigation` landmark, the current year, the `contentinfo` landmark — must still pass. If the `contentinfo` landmark test fails, the `<footer>` element lost its landmark role by being nested inside a sectioning element; it must stay a direct child of `<body>`.

- [ ] **Step 5: Style them**

Create `styles/_header.scss`:

```scss
.site-header {
  padding-block: 1.5rem 0;
}

.site-header__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.site-header__wordmark {
  font-family: var(--font-display), system-ui, sans-serif;
  font-variation-settings: 'wdth' 125;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  color: var(--ink-primary);
}

.site-header__links {
  display: flex;
  gap: 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-decoration: none;
    color: var(--ink-muted);

    &:hover {
      color: var(--pigment-indigo);
    }
  }
}

.site-header__rule {
  margin-top: 1rem;
}

.site-footer {
  padding-block: var(--space-band) 2rem;
}

.site-footer__rule {
  margin-bottom: 1rem;
}
```

Add `@use 'header';` to `styles/style.scss` after `@use 'gallery';`.

- [ ] **Step 6: Verify**

```bash
npm test
npm run build
```

Expected: full suite passes. In the browser, the header reads `zenon billings` on the left with lowercase nav on the right, and a drawn rule beneath.

- [ ] **Step 7: Commit**

```bash
git add components/SiteHeader.tsx components/SiteFooter.tsx tests/components/SiteHeader.test.tsx \
        tests/components/SiteFooter.test.tsx styles/_header.scss styles/style.scss
git commit -m "feat: restyle the site header and footer"
```

---

## Task 10: Home hero

**Files:**
- Modify: `app/page.tsx`, `styles/style.scss`
- Create: `styles/_home.scss`

**Interfaces:**
- Consumes: `WashBloom` (Task 6), `InkRule` (Task 6), `.paper-sheet--deckle` (Task 6), `.lowercase-chrome` (Task 1).
- Produces: nothing later tasks depend on.

**No unit test.** `app/**/page.tsx` is excluded from coverage by design (see `vitest.config.ts`) because these are server components that only compose already-tested pieces around a build-time fetch. Verification is the build plus the Playwright suite in Task 15.

**Decision recorded here** because the spec left it implicit: the home `<h1>` renders `settings.artistName` and **is** the wordmark — the site's identity, not artwork content — so lowercase applies to it. Artwork titles remain untouched.

- [ ] **Step 1: Rewrite the page**

Replace the returned JSX in `app/page.tsx`, leaving the imports for `client` and the queries and the `Promise.all` fetch exactly as they are, and adding the three new imports:

```tsx
import Link from 'next/link'
import ArtworkGrid from '@/components/ArtworkGrid'
import InkRule from '@/components/InkRule'
import WashBloom from '@/components/WashBloom'
import { client } from '@/lib/sanity/client'
import { FEATURED_ARTWORKS_QUERY, SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'
```

```tsx
  return (
    <>
      <section className="hero paper-sheet--deckle">
        <WashBloom pigment="watercolour" className="hero__bloom" />
        <hgroup className="hero__group">
          <h1 className="hero__wordmark lowercase-chrome">
            {settings?.artistName ?? 'Zenon Billings'}
          </h1>
          {settings?.tagline && <p className="hero__tagline">{settings.tagline}</p>}
        </hgroup>
      </section>

      <section className="home-featured">
        <h2 className="lowercase-chrome">Featured work</h2>
        <InkRule className="home-featured__rule" />
        <ArtworkGrid
          artworks={featured}
          emptyMessage="No featured artwork yet — browse the full gallery below."
        />
      </section>

      <p className="home-cta">
        <Link href="/gallery" role="button" className="lowercase-chrome">
          View the full gallery
        </Link>
      </p>
    </>
  )
```

- [ ] **Step 2: Style the hero**

Create `styles/_home.scss`:

```scss
.hero {
  position: relative;
  isolation: isolate;
  padding-block: clamp(2rem, 7vw, 5rem) var(--space-band);
  overflow: hidden;
}

.hero__bloom {
  // The bloom bleeds past the container on purpose; the parent clips it so the
  // overhang never reaches the document and produces a horizontal scrollbar.
  top: -20%;
  right: -15%;
  width: 60%;
  height: 130%;
}

.hero__wordmark {
  font-size: clamp(3rem, 9vw, 7rem);
  font-weight: 600;
  line-height: 0.95;
  letter-spacing: -0.02em;
  margin: 0;
  max-width: 14ch;
}

.hero__tagline {
  margin-top: 1.25rem;
  font-size: clamp(1rem, 2vw, 1.25rem);
  color: var(--ink-muted);
  max-width: 40ch;
}

.home-featured {
  padding-block: var(--space-band) 0;
}

.home-featured__rule {
  margin: 0.5rem 0 var(--space-sheet);
}

.home-cta {
  margin-top: var(--space-band);
}
```

Add `@use 'home';` to `styles/style.scss` after `@use 'header';`.

- [ ] **Step 3: Verify**

```bash
npm test
npm run build
npm run dev
```

Expected: tests pass, build succeeds. The home page shows a large lowercase wordmark with a soft pigment bloom behind it to the upper right, a torn lower edge on the hero band, and `featured work` beneath a drawn rule. Confirm no horizontal scrollbar at 320px width.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx styles/_home.scss styles/style.scss
git commit -m "feat: compose the home hero"
```

---

## Task 11: Gallery filter chips and ruled search

The accessibility-critical task. Converting checkboxes to styled labels is exactly the change that silently destroys keyboard and screen reader access — the existing `GalleryBrowser` tests are the guard, and they must keep passing **unmodified**.

**Files:**
- Modify: `components/GalleryBrowser.tsx`, `styles/_gallery.scss`, `styles/style.scss`
- Create: `styles/_forms.scss`
- Test: `tests/components/GalleryBrowser.test.tsx` (add to it; change nothing that exists)

**Interfaces:**
- Consumes: `.visually-hidden` (Task 6), `.studio-label` (Task 1).
- Produces: `.tag-chip`, `.field-ruled`, `.button-pigment` — Task 14 reuses the latter two.

- [ ] **Step 1: Write the failing test**

Add to the existing `describe('GalleryBrowser')` block. **Do not modify the seven tests already there** — they are the regression guard:

```tsx
  it('keeps every tag reachable as a real checkbox after the chip restyle', async () => {
    render(<GalleryBrowser artworks={artworks} />)
    const tag = screen.getByRole('checkbox', { name: 'portrait' })

    expect(tag).not.toBeChecked()
    await userEvent.click(tag)
    expect(tag).toBeChecked()
  })
```

- [ ] **Step 2: Run the tests and confirm they pass**

```bash
npm test -- tests/components/GalleryBrowser.test.tsx
```

Expected: PASS, 8 tests. **This one is deliberately not a RED step**, and that is not an oversight. The behaviour already works; what is about to change is the markup underneath it. This is a characterisation test — written before the refactor, capturing the behaviour that must survive it. Its value is entirely in staying green through Step 3. Record the passing count before continuing.

- [ ] **Step 3: Restructure the markup**

In `components/GalleryBrowser.tsx`, replace the returned JSX. The state logic, `useMemo` calls, and `toggleTag` stay exactly as they are:

```tsx
  return (
    <>
      <search className="gallery-filters">
        <label htmlFor="artwork-search" className="studio-label">
          Search artwork
        </label>
        <input
          id="artwork-search"
          type="search"
          className="field-ruled"
          placeholder="Title or tag"
          value={filter.searchTerm}
          onChange={(event) =>
            setFilter((current) => ({ ...current, searchTerm: event.target.value }))
          }
        />

        {tags.length > 0 && (
          <fieldset className="tag-filter">
            <legend className="studio-label">Filter by tag</legend>
            {tags.map((tag) => (
              <label key={tag.slug} className="tag-chip">
                <input
                  type="checkbox"
                  className="visually-hidden"
                  checked={filter.tagSlugs.includes(tag.slug!)}
                  onChange={() => toggleTag(tag.slug!)}
                />
                {tag.name}
              </label>
            ))}
          </fieldset>
        )}

        <p role="status" className="studio-label result-count">
          Showing {visible.length} of {artworks.length}
        </p>
      </search>

      <ArtworkGrid artworks={visible} emptyMessage="No artwork matches that search." />
    </>
  )
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- tests/components/GalleryBrowser.test.tsx
```

Expected: PASS, 8 tests. **If any of the original seven now fail, stop and fix the markup — do not adjust the tests.** A failure here means the restyle broke keyboard or screen reader access, which is the one outcome this task must not produce.

- [ ] **Step 5: Style the chips and the ruled fields**

Append to `styles/_gallery.scss`:

```scss
.gallery-filters {
  display: block;
  margin-bottom: var(--space-band);
}

.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border: 0;
  padding: 0;
  margin: 1rem 0;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  padding: 0.3rem 0.85rem;
  border: 1px solid var(--pigment-payne-grey);
  border-radius: 999px;
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  color: var(--pigment-payne-grey);
  cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;

  &:has(:checked) {
    background: var(--pigment-payne-grey);
    color: var(--paper-cold-press);
  }

  // The input is off-screen, so its focus ring has to be drawn on the chip the
  // visitor can actually see.
  &:has(:focus-visible) {
    outline: 2px solid var(--pigment-indigo);
    outline-offset: 2px;
  }
}

// Without :has(), a chip could never show its checked state. Showing the native
// checkbox is worse-looking and entirely usable, which is the right trade.
@supports not (selector(:has(*))) {
  .tag-chip .visually-hidden {
    position: static;
    width: auto;
    height: auto;
    margin-right: 0.4rem;
  }
}

.result-count {
  margin-top: 1rem;
}
```

Create `styles/_forms.scss`:

```scss
.field-ruled {
  display: block;
  width: 100%;
  max-width: 32rem;
  margin-top: 0.35rem;
  padding: 0.4rem 0;
  border: 0;
  border-bottom: 1px solid var(--pigment-payne-grey);
  border-radius: 0;
  background: transparent;
  font-family: var(--font-body), system-ui, sans-serif;
  font-size: 1rem;
  color: var(--ink-primary);

  &:focus {
    outline: 0;
    border-bottom-width: 2px;
    border-bottom-color: var(--pigment-indigo);
  }

  &:focus-visible {
    outline: 2px solid var(--pigment-indigo);
    outline-offset: 4px;
  }
}

.button-pigment {
  display: inline-block;
  padding: 0.6rem 1.4rem;
  border: 0;
  border-radius: 2px;
  background: var(--pigment-indigo);
  color: var(--paper-cold-press);
  font-family: var(--font-body), system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  cursor: pointer;

  &:hover {
    background: var(--pigment-payne-grey);
  }

  &[disabled] {
    opacity: 0.6;
    cursor: default;
  }
}
```

In `styles/style.scss`: add `@use 'forms';` after `@use 'home';`, and **delete** the old `.tag-filter` and `.result-count` blocks — both are now defined in `_gallery.scss`.

- [ ] **Step 6: Verify, including by keyboard**

```bash
npm test
npm run build
npm run dev
```

Expected: full suite passes. At `/gallery`, tags render as pill chips that fill with pigment when selected, and the search field is a single ruled line. **Tab to a chip and confirm a visible focus ring appears on the chip itself**, then press Space and confirm it toggles. If the focus ring is invisible, the `:has(:focus-visible)` rule is not matching — check that the input is inside the label.

- [ ] **Step 7: Commit**

```bash
git add components/GalleryBrowser.tsx tests/components/GalleryBrowser.test.tsx \
        styles/_gallery.scss styles/_forms.scss styles/style.scss
git commit -m "feat: restyle gallery filters as pigment chips"
```

---

## Task 12: Artwork detail placard

**Files:**
- Modify: `app/artwork/[slug]/page.tsx`, `app/gallery/page.tsx`, `styles/_artwork.scss`
- Create: nothing.

**Interfaces:**
- Consumes: `StudioLabel` (Task 4), `MediumChip` (Task 5), `WashBloom` (Task 6), `pigmentForMedium` (Task 3), `.paper-sheet` (Task 6).
- Produces: nothing later tasks depend on.

**No unit test** — `app/**/page.tsx` is excluded from coverage by design.

- [ ] **Step 1: Rewrite the detail page body**

In `app/artwork/[slug]/page.tsx`, add the imports and replace the returned JSX. The `generateStaticParams`, `generateMetadata`, the fetch, and the JSON-LD `<script>` all stay exactly as they are. The local `dimensions` const is no longer needed — `StudioLabel` derives it — so delete that line and the now-unused `formatDimensions` import.

```tsx
import MediumChip from '@/components/MediumChip'
import StudioLabel from '@/components/StudioLabel'
import WashBloom from '@/components/WashBloom'
import { pigmentForMedium } from '@/lib/artwork/pigmentForMedium'
```

```tsx
  return (
    <article className="artwork-detail">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildArtworkJsonLd(artwork, settings, siteUrl)),
        }}
      />

      <div className="artwork-detail__plate">
        <WashBloom
          pigment={pigmentForMedium(artwork.medium)}
          className="artwork-detail__bloom"
        />
        {artwork.image && (
          <div className="paper-sheet artwork-detail__mount">
            <SanityImage
              source={artwork.image}
              alt={artwork.altText ?? artwork.title ?? ''}
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority
              className="artwork-detail__image"
            />
          </div>
        )}
      </div>

      <div className="artwork-detail__placard">
        <h1>{artwork.title}</h1>
        <StudioLabel artwork={artwork} />
        {artwork.description && <p>{artwork.description}</p>}
        <p className="artwork-detail__medium">
          <MediumChip medium={artwork.medium} />
        </p>
        {artwork.tags && artwork.tags.length > 0 && (
          <p className="artwork-tags">
            {artwork.tags.map((tag) => (
              <mark key={tag._id}>{tag.name}</mark>
            ))}
          </p>
        )}
      </div>
    </article>
  )
```

- [ ] **Step 2: Make the gallery heading lowercase chrome**

In `app/gallery/page.tsx`, change the heading:

```tsx
      <h1 className="lowercase-chrome">Gallery</h1>
```

- [ ] **Step 3: Style the detail layout**

Append to `styles/_artwork.scss`:

```scss
.artwork-detail {
  display: grid;
  gap: var(--space-sheet);
  padding-block: var(--space-sheet) var(--space-band);
}

@media (min-width: 900px) {
  .artwork-detail {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    gap: var(--space-band);
  }
}

.artwork-detail__plate {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.artwork-detail__bloom {
  top: -10%;
  left: -12%;
  width: 70%;
  height: 120%;
}

.artwork-detail__mount {
  display: grid;
  place-items: center;
}

.artwork-detail__image {
  max-width: 100%;
  height: auto;
  display: block;
}

.artwork-detail__placard {
  h1 {
    margin-bottom: 0.5rem;
  }

  p {
    margin-top: 1rem;
  }
}

// Keeps the metadata alongside the reader while a tall painting scrolls past.
// CSS only — no scroll listener, no JavaScript.
@media (min-width: 900px) {
  .artwork-detail__placard {
    position: sticky;
    top: 2rem;
    align-self: start;
  }
}

.medium-chip {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border: 1px solid currentcolor;
  border-radius: 999px;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--medium-other);

  &[data-pigment='watercolour'] {
    color: var(--medium-watercolour);
  }

  &[data-pigment='drawing'] {
    color: var(--medium-drawing);
  }

  &[data-pigment='photography'] {
    color: var(--medium-photography);
  }
}

.artwork-tags mark {
  margin-right: 0.25rem;
  background: color-mix(in srgb, var(--pigment-raw-umber) 18%, transparent);
  color: var(--ink-primary);
}
```

In `styles/style.scss`, **delete** the old `.artwork-tags mark` block — it now lives in `_artwork.scss`.

- [ ] **Step 4: Verify**

```bash
npm test
npm run lint
npm run build
npm run dev
```

Expected: tests pass; lint reports no unused import (if it flags `formatDimensions`, the import was not removed in Step 1). On an artwork page at desktop width, the image sits mounted on a paper sheet with a bloom behind it, and the placard column stays in view while scrolling. On mobile it collapses to one column.

- [ ] **Step 5: Commit**

```bash
git add app/artwork/ app/gallery/page.tsx styles/_artwork.scss styles/style.scss
git commit -m "feat: compose the artwork detail placard"
```

---

## Task 13: About spread

**Files:**
- Modify: `app/about/page.tsx`, `styles/style.scss`
- Create: `styles/_about.scss`

**Interfaces:**
- Consumes: `.paper-sheet` (Task 6), `.lowercase-chrome` (Task 1).
- Produces: nothing.

**No unit test** — page component, excluded from coverage.

- [ ] **Step 1: Rewrite the page body**

In `app/about/page.tsx`, replace the returned JSX. Imports and the fetch stay as they are.

```tsx
  return (
    <div className="about">
      <h1 className="lowercase-chrome">About {settings?.artistName ?? 'the artist'}</h1>

      <div className="about__spread">
        {settings?.profileImage && (
          <figure className="paper-sheet about__portrait">
            <SanityImage
              source={settings.profileImage}
              alt={`Portrait of ${settings.artistName ?? 'the artist'}`}
              widths={[300, 600]}
              sizes="(max-width: 600px) 100vw, 300px"
              className="profile-image"
            />
          </figure>
        )}

        <div className="about__bio">
          {settings?.bio ? <PortableText value={settings.bio} /> : <p>Biography coming soon.</p>}
        </div>
      </div>
    </div>
  )
```

- [ ] **Step 2: Style the spread**

Create `styles/_about.scss`:

```scss
.about {
  padding-block: var(--space-sheet) var(--space-band);
}

.about__spread {
  display: grid;
  gap: var(--space-band);
  margin-top: var(--space-sheet);
}

@media (min-width: 800px) {
  .about__spread {
    grid-template-columns: 18rem minmax(0, 1fr);
    align-items: start;
  }
}

.about__portrait {
  margin: 0;
  transform: rotate(calc(var(--edge-tilt) * -1));
}

.profile-image {
  display: block;
  max-width: 100%;
  height: auto;
}

// A drop cap is the one piece of editorial ornament the bio gets; the type
// stays disciplined everywhere else.
.about__bio > p:first-of-type::first-letter {
  float: left;
  margin: 0.08em 0.08em 0 0;
  font-family: var(--font-display), system-ui, sans-serif;
  font-variation-settings: 'wdth' 125;
  font-size: 3.2em;
  line-height: 0.82;
  color: var(--pigment-indigo);
}
```

In `styles/style.scss`: add `@use 'about';` after `@use 'forms';`, and **delete** the old `.profile-image` block.

- [ ] **Step 3: Verify**

```bash
npm test
npm run build
npm run dev
```

Expected: tests pass. At `/about`, the portrait sits on a tilted paper mount beside the bio, and the first paragraph opens with a large indigo drop cap. If the drop cap does not appear, the bio's first block is not a `<p>` — check what `PortableText` emitted and adjust the selector to match.

- [ ] **Step 4: Commit**

```bash
git add app/about/page.tsx styles/_about.scss styles/style.scss
git commit -m "feat: compose the about spread"
```

---

## Task 14: Contact sheet

**Files:**
- Modify: `app/contact/page.tsx`, `components/ContactForm.tsx`, `components/ContactAliasLink.tsx`, `styles/style.scss`
- Create: `styles/_contact.scss`
- Test: `tests/components/ContactForm.test.tsx`, `tests/components/ContactAliasLink.test.tsx` (both exist — they must keep passing unchanged)

**Interfaces:**
- Consumes: `.field-ruled` and `.button-pigment` (Task 11), `.paper-sheet` (Task 6), `.studio-label` (Task 1).
- Produces: nothing.

- [ ] **Step 1: Confirm the contact tests are green before touching the form**

```bash
npm test -- tests/components/ContactForm.test.tsx tests/components/ContactAliasLink.test.tsx
```

Expected: PASS. This task is presentational only — every one of these tests must still pass at the end, unmodified. Note the count.

- [ ] **Step 2: Apply the classes**

In `components/ContactForm.tsx`, the only changes are class names — no logic, no state, no handler changes. Add `className="field-ruled"` to the three inputs (`contact-name`, `contact-email`, `contact-message`), `className="studio-label"` to the three visible `<label>` elements, and `className="button-pigment"` to the submit button. Leave the honeypot input's `visually-hidden` class exactly as it is.

The submit button becomes:

```tsx
      <button type="submit" className="button-pigment" aria-busy={sending} disabled={sending}>
        {sending ? 'Sending…' : 'Send message'}
      </button>
```

In `components/ContactAliasLink.tsx`, add the brush underline class:

```tsx
export default function ContactAliasLink({ alias }: { alias?: string | null }) {
  if (!alias) return null

  return (
    <p className="contact-alias">
      Prefer your own mail client?{' '}
      <a href={`mailto:${alias}`} className="brush-underline">
        {alias}
      </a>
    </p>
  )
}
```

In `app/contact/page.tsx`, wrap the form in a sheet:

```tsx
  return (
    <div className="contact">
      <h1 className="lowercase-chrome">Contact</h1>

      <div className="paper-sheet contact__sheet">
        <ContactForm />
      </div>

      <ContactAliasLink alias={settings?.publicContactAlias} />
    </div>
  )
```

- [ ] **Step 3: Run the contact tests to verify nothing broke**

```bash
npm test -- tests/components/ContactForm.test.tsx tests/components/ContactAliasLink.test.tsx
```

Expected: PASS, the same count as Step 1. **If any test fails, the change was not presentational — revert and re-apply only the class names.**

- [ ] **Step 4: Style the sheet**

Create `styles/_contact.scss`:

```scss
.contact {
  padding-block: var(--space-sheet) var(--space-band);
}

.contact__sheet {
  max-width: 34rem;
  margin-top: var(--space-sheet);

  textarea.field-ruled {
    border: 1px solid var(--pigment-payne-grey);
    padding: 0.6rem;
    resize: vertical;
  }

  label {
    display: block;
    margin-top: 1.25rem;
  }

  [role='alert'] {
    color: var(--pigment-burnt-sienna);
  }
}

.contact-alias {
  margin-top: var(--space-sheet);
  color: var(--ink-muted);
}

// A brush stroke rather than a border: it grows from nothing on hover the way
// pigment loads onto paper.
.brush-underline {
  text-decoration: none;
  background-image: linear-gradient(
    to right,
    var(--pigment-burnt-sienna),
    var(--pigment-burnt-sienna)
  );
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 100% 1px;
  transition: background-size 220ms cubic-bezier(0.22, 0.61, 0.36, 1);
  color: var(--pigment-burnt-sienna);

  &:hover,
  &:focus-visible {
    background-size: 100% 3px;
  }
}
```

Add `@use 'contact';` to `styles/style.scss` after `@use 'about';`.

- [ ] **Step 5: Verify**

```bash
npm test
npm run build
npm run dev
```

Expected: full suite passes. At `/contact`, the form sits on a paper sheet with ruled inputs and a pigment submit button. Submit the empty form and confirm the validation errors still appear in burnt sienna.

- [ ] **Step 6: Commit**

```bash
git add app/contact/page.tsx components/ContactForm.tsx components/ContactAliasLink.tsx \
        styles/_contact.scss styles/style.scss
git commit -m "feat: compose the contact sheet"
```

---

## Task 15: End-to-end layout guard

`tests/e2e/` does not exist yet — `playwright.config.ts` is configured but no specs are written. This adds the first, and it guards the single most likely regression in this redesign: blooms and tilts bleeding past their containers and producing a horizontal scrollbar.

**Files:**
- Create: `tests/e2e/layout.spec.ts`

**Interfaces:**
- Consumes: the built static site in `out/`.
- Produces: nothing.

- [ ] **Step 1: Install the browser**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Write the test**

Create `tests/e2e/layout.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

// Blooms deliberately bleed past their containers and cards are rotated. Both
// are exactly what produces an accidental horizontal scrollbar, and neither is
// visible in a jsdom unit test.
const PAGES = ['/', '/gallery/', '/about/', '/contact/']

const VIEWPORTS = [
  { name: 'mobile', width: 320, height: 640 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
]

for (const path of PAGES) {
  for (const viewport of VIEWPORTS) {
    test(`${path} does not scroll horizontally on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(path)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )

      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}
```

- [ ] **Step 3: Build and run it**

The Playwright web server serves `out/`, so the site must be built first:

```bash
npm run build
npm run test:e2e
```

Expected: PASS, 12 tests.

**If a test fails**, the culprit is almost always a bloom whose parent is missing `overflow: hidden`, or a rotated card in the outermost grid column. Fix the CSS — clip the bloom's parent, or reduce `--edge-tilt` — rather than relaxing the assertion.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/layout.spec.ts
git commit -m "test: guard against horizontal overflow at three viewports"
```

---

## Task 16: Documentation

Documentation is part of the work (AGENTS.md §6). Two files are now out of date because of this redesign.

**Files:**
- Modify: `AGENTS.md` (repository root), `README.md` (repository root)

- [ ] **Step 1: Correct the styling section in AGENTS.md**

In §3 Tech Stack Specifics, the CSS bullet currently reads "All customizations happen in `styles/style.scss`." That is no longer true. Replace that bullet with:

```markdown
- **CSS**: `Pico.css` (SCSS), compiled via Next.js's built-in Sass support.
    - `styles/style.scss` is the entry point only: it imports Pico and `@use`s the partials.
    - Customizations live in per-area partials — `_tokens.scss` (the palette and the
      `--pico-*` bridge), `_typography.scss`, `_materials.scss`, and one partial per page
      or component area.
    - Change a colour or a spacing value in `_tokens.scss`, never at the point of use.
    - Do not edit Pico's source.
```

Also update the `styles/` line in the §2 directory tree:

```text
│   ├── styles/       # SCSS entry point + per-area partials (see §3)
```

- [ ] **Step 2: Add a design system section to README.md**

Add this section to `README.md`, after the existing project structure or setup material:

```markdown
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

| Change | File |
|---|---|
| A colour, spacing value, or the mat ratio | `web/styles/_tokens.scss` |
| Type scale or the studio label | `web/styles/_typography.scss` |
| Paper texture, blooms, ink rules, deckle edge | `web/styles/_materials.scss` |
| Anything specific to one page | `web/styles/_<area>.scss` |

### Palette

Pigments are named for what they are, never for where they are used. Each artwork medium maps
to one, in `_tokens.scss`, and `lib/artwork/pigmentForMedium.ts` resolves a medium to its
pigment name — including the fallback for unrecognised values.

| Medium | Pigment | Hex | Contrast on paper |
|---|---|---|---|
| watercolour | indigo | `#2e3a5c` | 10.1:1 |
| drawing | payne's grey | `#3d4f5c` | 7.7:1 |
| photography | burnt sienna | `#9c5433` | 5.1:1 |
| other | raw umber | `#6b5b45` | 5.9:1 |

Body text is `--ink-primary` (`#2a3138`, 11.9:1); studio labels are `--ink-muted`
(`#6e6a63`, 4.9:1). **Any new text colour must clear 4.5:1 against `--paper-cold-press`**
(3:1 for display sizes at 24px or larger). The palette bends to the contrast requirement,
never the reverse.

### Typography

Archivo Expanded (`wdth` 125) for display, Inter for everything else, both self-hosted via
`next/font`. Lowercase is applied through the `.lowercase-chrome` class and covers site chrome
only — the wordmark, navigation, and headings the code controls. **Artwork titles render
exactly as the artist entered them in Sanity.**
```

- [ ] **Step 3: Verify**

Re-read both files and confirm no statement contradicts the code as it now stands. In particular, check that every partial listed in the README table actually exists in `web/styles/`.

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md README.md
git commit -m "docs: document the studio/pigment design system"
```

---

## Final verification

After Task 16, run the whole thing once from clean:

```bash
cd web
npm run lint && npm run format:check
npm test -- --coverage
npm run build
npm run test:e2e
```

Expected: lint and format clean; all unit tests pass with coverage at or above 80% on every metric; build succeeds; all 12 Playwright tests pass.

Then check by eye, at 320px and at desktop width, that every page renders on paper, that no page scrolls horizontally, and that at most one bloom is visible in any single viewport.
