# Static Portfolio (Zenon Billings) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `artist-portfolio-montana` Django site as a statically-exported Next.js portfolio backed by Sanity, deployed to Cloudflare Pages with no origin server.

**Architecture:** Sanity's Content Lake is the only datastore; a standalone Sanity Studio in `studio/` edits it. Next.js fetches everything at build time via GROQ and emits pure static files to `out/`. The gallery's filter/search runs client-side over a build-time payload, so there is no request-time code anywhere in the deployed artifact. The contact form posts to a third-party endpoint behind a provider-agnostic adapter.

**Tech Stack:** Next.js (App Router, `output: 'export'`), TypeScript, Sanity v3 + `next-sanity`, Pico.css via SCSS, Vitest + Testing Library, Playwright, Prettier, ESLint, Cloudflare Pages.

**Spec:** `docs/execution_plan.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Repository layout is two sibling packages:** `web/` (the Next.js site) and `studio/`
  (Sanity Studio), with **no dependencies at the repository root**. Every site path in
  this plan — `app/`, `components/`, `lib/`, `styles/`, `tests/`, `scripts/` — is relative
  to `web/`. Never add a root `package.json` dependency: a shared `node_modules` above the
  two packages lets the Studio resolve the site's copy of `sanity` and breaks it at runtime.
- **TDD is mandatory.** RED (failing test) → GREEN (minimal code) → REFACTOR. Never write implementation before a failing test.
- **Test coverage floor: 80%.** Enforced by `vitest --coverage` thresholds. The measured
  surface excludes generated types, the server-component pages (`app/**/page.tsx`,
  `app/layout.tsx`, verified by Playwright), and `scripts/seed-gallery.ts` (dev-only CLI
  whose pure logic is covered in `scripts/metMuseum.ts`). Do not widen that list to make
  a failing run pass.
- **Test files mirror source structure:** `components/ArtworkCard.tsx` → `tests/components/ArtworkCard.test.tsx`.
- **Sanity project ID:** `nlwxmhc1`
- **Sanity datasets:** `production` (real content) and `development` (seeded sample data, used for all local work).
- **Sanity API version:** `2026-08-24` — hard-coded to the date the integration was
  written, per Sanity's guidance. Pin it; never float it.
- **Next.js must stay in static export mode.** `output: 'export'`. No route handlers, no server actions, no middleware, no `next/image` optimization, no `dynamic = 'force-dynamic'`. If a task seems to need a server, it is the wrong approach.
- **Styling:** Pico.css compiled through Next's built-in Sass support. All customization goes in `styles/style.scss`. No inline styles unless genuinely unavoidable.
- **No inline styles, no CSS-in-JS, no Tailwind.**
- **Formatter/linter:** Prettier and ESLint must pass before every commit.
- **Comments explain why, never what.** Prefer a better name over a comment.
- **Ubiquitous language:** the domain terms are `artwork`, `tag`, `siteSettings`, `medium`, `slug`. Use them consistently in code, tests, and content.
- **Secrets never enter the repo.** `SANITY_WRITE_TOKEN` lives in `.env.local` (gitignored). The Web3Forms access key is a public-safe token and may ship in the client bundle.
- **Commit after every task**, using Conventional Commit prefixes (`feat:`, `test:`, `chore:`, `docs:`, `fix:`).
- **Documentation is part of the work.** Any new command must be documented in `README.md` in the same task that introduces it.

---

## File Structure

```text
zenon-billings/
├── package.json                        # scripts only, NO dependencies
├── studio/                             # Sanity Studio (own package)
└── web/                                # Next.js site (own package)
├── app/
│   ├── layout.tsx                      # root layout, imports styles/style.scss
│   ├── page.tsx                        # Home — featured artwork
│   ├── about/page.tsx                  # About — siteSettings bio
│   ├── contact/page.tsx                # Contact — form + fallback mailto
│   ├── gallery/page.tsx                # Gallery — server-fetched, client-filtered
│   ├── artwork/[slug]/page.tsx         # Detail + VisualArtwork JSON-LD
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── SiteHeader.tsx
│   ├── SiteFooter.tsx
│   ├── SanityImage.tsx                 # responsive <img> with Sanity CDN srcset
│   ├── ArtworkCard.tsx
│   ├── ArtworkGrid.tsx
│   ├── GalleryBrowser.tsx              # 'use client' — owns filter state
│   └── ContactForm.tsx                 # 'use client'
├── lib/
│   ├── sanity/
│   │   ├── client.ts                   # configured Sanity client
│   │   ├── imageUrl.ts                 # image URL builder + srcset helper
│   │   ├── queries.ts                  # all GROQ, via defineQuery
│   │   └── sanity.types.ts             # GENERATED — never hand-edit
│   ├── gallery/
│   │   └── filterArtworks.ts           # pure search/tag filter
│   ├── contact/
│   │   ├── submitContactMessage.ts     # provider-agnostic interface
│   │   └── web3FormsClient.ts          # the only file that knows the vendor
│   └── seo/
│       └── artworkJsonLd.ts            # Schema.org VisualArtwork builder
├── scripts/
│   ├── seed-gallery.ts                 # CLI entrypoint
│   └── metMuseum.ts                    # pure Met API → artwork document mapping
├── studio/                             # standalone Sanity Studio (own package.json)
│   ├── sanity.config.ts
│   ├── schemaTypes/
│   │   ├── index.ts
│   │   ├── artwork.ts
│   │   ├── tag.ts
│   │   └── siteSettings.ts
│   └── tests/schemaTypes/*.test.ts
├── styles/
│   └── style.scss
├── tests/
│   ├── components/
│   ├── lib/
│   ├── scripts/
│   └── e2e/
├── AGENTS.md
├── README.md
└── docs/execution_plan.md
```

**Responsibility boundaries that matter:**

- `lib/gallery/filterArtworks.ts` is pure and knows nothing about React or Sanity — the filter's correctness is tested without rendering anything.
- `lib/contact/web3FormsClient.ts` is the only file that names the vendor. Swapping providers touches one file.
- `lib/sanity/queries.ts` holds every GROQ string. Components never write GROQ.
- `studio/` is a separate npm package. The app never imports from it; the schema contract crosses the boundary as generated types.

---

## Task 1: Project scaffold, tooling, and base layout

> **STATUS: COMPLETE** (commit `504d14d`). This section was revised during execution to
> record what the toolchain actually required — see "Deviations from the original plan"
> at the end of the task. Later tasks depend on these decisions.

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `.gitignore`, `.env.example`, `README.md`
- Create: `app/layout.tsx`, `app/page.tsx`, `components/SiteHeader.tsx`, `components/SiteFooter.tsx`, `styles/style.scss`
- Test: `tests/components/SiteHeader.test.tsx`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a buildable static-export Next.js app; `npm test`, `npm run lint`, `npm run build` all green. Exports `SiteHeader()` and `SiteFooter()` as default-exported React components taking no props.

- [x] **Step 1: Scaffold the Next.js app**

`create-next-app` refuses to run in a directory containing `AGENTS.md`, so scaffold into a
temp directory and copy the pieces across. **Do not copy the scaffold's own `AGENTS.md`,
`CLAUDE.md`, or `README.md`** — they would overwrite the project's real ones.

```bash
cd /tmp && npx --yes create-next-app@latest scaffold \
  --typescript --eslint --app --src-dir=false \
  --import-alias "@/*" --no-tailwind --yes
```

Then, from the project root, copy only:

```bash
for item in .gitignore app eslint.config.mjs next-env.d.ts next.config.ts \
            package.json package-lock.json public tsconfig.json; do
  cp -r "/tmp/scaffold/$item" ./
done
```

- [x] **Step 2: Install the remaining tooling**

```bash
npm install
npm install next-sanity @sanity/image-url @picocss/pico
npm install -D vitest jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @vitest/coverage-v8 @playwright/test prettier sass tsx serve
npx playwright install chromium
```

**`@vitejs/plugin-react` is deliberately excluded.** Installing it fails with an
unresolvable peer conflict: `@vitejs/plugin-react@6` pulls `@rolldown/plugin-babel` →
`@babel/plugin-transform-runtime@8`, requiring `@babel/core@^8`, while `@sanity/codegen`
(via `next-sanity`) requires `@babel/preset-env@^7`, which needs `@babel/core@^7`. Do
**not** reach for `--legacy-peer-deps` or `--force`; the plugin only provides Fast Refresh
for a Vite dev server that this project never runs, and Vitest 4 transforms JSX through
oxc with no plugin at all.

`npx playwright install --with-deps` requires sudo and will fail in a non-interactive
shell. Plain `npx playwright install chromium` works when the system libraries are already
present.

- [x] **Step 3: Configure static export**

Replace `next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  // Sanity's CDN handles resizing; Next's optimizer needs a server we don't have.
  images: { unoptimized: true },
  // Emits directory/index.html pairs, which Cloudflare Pages serves without redirect hops.
  trailingSlash: true,
  sassOptions: {
    loadPaths: ['./node_modules/@picocss/pico/scss'],
    // Raised by Pico's own source, which AGENTS.md forbids editing.
    silenceDeprecations: ['if-function'],
  },
}

export default nextConfig
```

Next 16 uses the modern Sass API: the option is `loadPaths`, **not** the legacy
`includePaths`. `includePaths` is silently ignored and the build fails with
"Can't find stylesheet to import."

- [x] **Step 4: Configure Vitest with the 80% coverage floor**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Vitest 4 transforms JSX through oxc with no plugin needed. @vitejs/plugin-react
// is deliberately absent: it exists for Vite dev-server Fast Refresh, which this
// project never runs, and its Babel 8 chain conflicts with the Babel 7 that
// @sanity/codegen requires.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      include: ['app/**', 'components/**', 'lib/**', 'scripts/**'],
      exclude: ['lib/sanity/sanity.types.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [x] **Step 5: Configure Playwright against the exported output**

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  // Playwright tests the real static export, not the dev server.
  webServer: {
    command: 'npx serve out -l 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [x] **Step 6: Set the package metadata TypeScript and Vitest both need**

Three edits to files the scaffold generated, all of which break the build if skipped:

1. `package.json` — rename from `scaffold` to `zenon-billings`, and add `"type": "module"`
   so `vitest.config.ts` is not loaded as CommonJS.
2. `tsconfig.json` — add `"types": ["vitest/globals", "node"]` to `compilerOptions`.
   `next build` type-checks the `tests/` directory, and without this it fails with
   `TS2582: Cannot find name 'describe'`.
3. Delete the scaffold's unused assets: `app/globals.css`, `app/favicon.ico`,
   `app/page.module.css`, and the SVGs in `public/`.

- [x] **Step 7: Add Prettier config and npm scripts**

`.prettierrc`:

```json
{
  "semi": false,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

`.prettierignore` — note the last block: Prettier pads markdown tables into unreadable
walls, so the prose documents are excluded.

```text
.next
out
node_modules
coverage
package-lock.json
lib/sanity/sanity.types.ts

# Prose documents — Prettier's table padding hurts readability here
AGENTS.md
docs/
```

Set `scripts` in `package.json`. Use `eslint`, not `next lint` — the latter is removed in
Next 16:

```json
{
  "dev": "next dev",
  "build": "next build",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "lint": "eslint",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

- [x] **Step 8: Write the failing test for SiteHeader**

`tests/components/SiteHeader.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import SiteHeader from '@/components/SiteHeader'

describe('SiteHeader', () => {
  it('links to every top-level section', () => {
    render(<SiteHeader />)

    expect(screen.getByRole('link', { name: /gallery/i })).toHaveAttribute('href', '/gallery')
    expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: /contact/i })).toHaveAttribute('href', '/contact')
  })

  it('exposes the navigation as a landmark', () => {
    render(<SiteHeader />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
```

- [x] **Step 9: Run it to make sure it fails**

Run: `npm test`
Expected: FAIL with `Failed to resolve import "@/components/SiteHeader"`.

- [x] **Step 10: Write the minimal SiteHeader and SiteFooter**

`components/SiteHeader.tsx`:

```tsx
import Link from 'next/link'

export default function SiteHeader() {
  return (
    <header className="container">
      <nav>
        <ul>
          <li>
            <Link href="/">
              <strong>Zenon Billings</strong>
            </Link>
          </li>
        </ul>
        <ul>
          <li>
            <Link href="/gallery">Gallery</Link>
          </li>
          <li>
            <Link href="/about">About</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
```

`components/SiteFooter.tsx`:

```tsx
export default function SiteFooter() {
  return (
    <footer className="container">
      <small>&copy; {new Date().getFullYear()} Zenon Billings</small>
    </footer>
  )
}
```

- [x] **Step 11: Run the tests and make sure they pass**

Run: `npm test`
Expected: PASS (2 tests).

- [x] **Step 12: Wire up Pico.css and the root layout**

`styles/style.scss`:

```scss
@use 'pico';

// Project customizations live below this line. Never edit Pico's source.
```

`app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import '@/styles/style.scss'

export const metadata: Metadata = {
  title: 'Zenon Billings',
  description: 'Watercolour, drawing, and photography by Zenon Billings.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main className="container">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
```

Replace `app/page.tsx` with a placeholder — Task 10 builds the real home page:

```tsx
export default function HomePage() {
  return <h1>Zenon Billings</h1>
}
```

- [x] **Step 13: Verify the static export builds**

Run: `npm run build`
Expected: PASS with no warnings, and `out/index.html` exists. Confirm Pico compiled in:

```bash
ls out/index.html
grep -ro 'pico' out/_next/static/chunks/*.css | head -1
```

- [x] **Step 14: Write `.env.example` and README setup docs**

`.env.example`:

```bash
# Sanity — project is public-readable, these are safe in the client bundle
NEXT_PUBLIC_SANITY_PROJECT_ID=nlwxmhc1
NEXT_PUBLIC_SANITY_DATASET=development

# Absolute site origin, used by sitemap.ts / robots.ts / OpenGraph tags
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Web3Forms contact endpoint key — public by design
NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=

# Write-scoped Sanity token, seed script only. NEVER commit a real value.
SANITY_WRITE_TOKEN=
```

Then `cp .env.example .env.local`.

`README.md` must document every script from Step 7, the two-dataset convention, and the
`@vitejs/plugin-react` omission so nobody "helpfully" reinstates it.

- [x] **Step 15: Confirm `.gitignore` covers secrets and build output**

It must include `.env*`, `/out/`, `.next/`, `node_modules/`, `/coverage/`,
`/playwright-report/`, `/test-results/`, and `/schema.json`. Because `.env*` is ignored,
add an explicit `!.env.example` exception or the template will never be committed.

Verify: `git check-ignore -v .env.local` matches, and `.env.example` does not.

- [x] **Step 16: Commit**

```bash
npm run format && npm run lint && npm test && npm run build
git add -A
git commit -m "chore: scaffold Next.js static export with Vitest, Playwright, and Pico.css"
```

### Deviations from the original plan

Recorded during execution so later tasks inherit the corrections:

| Planned | Actual | Why |
|---|---|---|
| Scaffold in place | Scaffold to temp dir, copy across | `create-next-app` refuses a directory containing `AGENTS.md` |
| Install `@vitejs/plugin-react` | Omitted entirely | Unresolvable Babel 7/8 peer conflict with `@sanity/codegen`; Vitest 4 uses oxc and needs no plugin |
| `sassOptions.includePaths` | `sassOptions.loadPaths` | Next 16 uses the modern Sass API |
| `"lint": "next lint"` | `"lint": "eslint"` | `next lint` is removed in Next 16 |
| — | `"type": "module"` in `package.json` | Otherwise `vitest.config.ts` loads as CommonJS |
| — | `"types": ["vitest/globals", "node"]` in `tsconfig.json` | `next build` type-checks `tests/` |
| — | `.prettierignore` excluding `AGENTS.md` and `docs/` | Prettier's table padding wrecks the prose documents |
| — | `silenceDeprecations: ['if-function']` | Pico's own source emits it and AGENTS.md forbids editing Pico |

---

## Task 2: Sanity Studio and content schemas

**Files:**
- Create: `studio/` (via scaffold), `studio/schemaTypes/artwork.ts`, `studio/schemaTypes/tag.ts`, `studio/schemaTypes/siteSettings.ts`, `studio/schemaTypes/index.ts`
- Modify: `studio/sanity.config.ts`
- Test: `studio/tests/schemaTypes/artwork.test.ts`, `studio/tests/schemaTypes/tag.test.ts`, `studio/tests/schemaTypes/siteSettings.test.ts`

**Interfaces:**
- Consumes: nothing from Task 1 — `studio/` is an independent package.
- Produces: three Sanity document types. Field names the rest of the plan depends on verbatim:
  - `artwork`: `title`, `slug`, `description`, `medium`, `image`, `altText`, `dimensions`, `yearCreated`, `isFeatured`, `price`, `tags`
  - `tag`: `name`, `slug`, `category`
  - `siteSettings`: `artistName`, `tagline`, `bio`, `profileImage`, `contactEmail`, `priceCurrency`

- [ ] **Step 1: Scaffold the Studio**

```bash
npm create sanity@latest -- \
  --project nlwxmhc1 --dataset production \
  --template clean --typescript --output-path studio
```

- [ ] **Step 2: Create the development dataset**

```bash
cd studio && npx sanity dataset create development && cd ..
```

Document both datasets and this command in `README.md`.

- [ ] **Step 3: Add Vitest to the Studio package**

The Studio is a separate package, so it gets its own test runner rather than the app reaching across the boundary.

```bash
cd studio && npm install -D vitest && cd ..
```

Add to `studio/package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 4: Write the failing schema tests**

`studio/tests/schemaTypes/artwork.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import artwork from '../../schemaTypes/artwork'

const fieldNames = () => artwork.fields.map((field) => field.name)
const fieldNamed = (name: string) => artwork.fields.find((field) => field.name === name)

describe('artwork schema', () => {
  it('is a document type named artwork', () => {
    expect(artwork.type).toBe('document')
    expect(artwork.name).toBe('artwork')
  })

  it('exposes every field the site reads', () => {
    expect(fieldNames()).toEqual(
      expect.arrayContaining([
        'title',
        'slug',
        'description',
        'medium',
        'image',
        'altText',
        'dimensions',
        'yearCreated',
        'isFeatured',
        'price',
        'tags',
      ]),
    )
  })

  it('enables hotspot on the image so crops stay art-directed', () => {
    expect(fieldNamed('image')?.options).toMatchObject({ hotspot: true })
  })

  it('derives the slug from the title', () => {
    expect(fieldNamed('slug')?.options).toMatchObject({ source: 'title' })
  })

  it('references tag documents', () => {
    expect(fieldNamed('tags')?.of).toEqual([{ type: 'reference', to: [{ type: 'tag' }] }])
  })
})
```

`studio/tests/schemaTypes/tag.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import tag from '../../schemaTypes/tag'

describe('tag schema', () => {
  it('is a flat document type with name, slug, and optional category', () => {
    expect(tag.name).toBe('tag')
    expect(tag.fields.map((field) => field.name)).toEqual(
      expect.arrayContaining(['name', 'slug', 'category']),
    )
  })

  it('has no parent field — the hierarchy was deliberately flattened', () => {
    expect(tag.fields.map((field) => field.name)).not.toContain('parent')
  })
})
```

`studio/tests/schemaTypes/siteSettings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import siteSettings from '../../schemaTypes/siteSettings'

describe('siteSettings schema', () => {
  it('holds the editable site-wide copy', () => {
    expect(siteSettings.fields.map((field) => field.name)).toEqual(
      expect.arrayContaining([
        'artistName',
        'tagline',
        'bio',
        'profileImage',
        'contactEmail',
        'priceCurrency',
      ]),
    )
  })
})
```

- [ ] **Step 5: Run them to make sure they fail**

Run: `cd studio && npm test`
Expected: FAIL — cannot resolve `../../schemaTypes/artwork`.

- [ ] **Step 6: Write the schemas**

`studio/schemaTypes/tag.ts`:

```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      validation: (rule) =>
        rule
          .required()
          .regex(/^[a-zA-Z-]+$/, { name: 'letters and hyphens only' }),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      type: 'string',
      description: 'Optional grouping label, e.g. medium or subject.',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'category' } },
})
```

`studio/schemaTypes/artwork.ts`:

```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'artwork',
  title: 'Artwork',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'description', type: 'text', rows: 4 }),
    defineField({
      name: 'medium',
      type: 'string',
      options: {
        list: [
          { title: 'Watercolour', value: 'watercolour' },
          { title: 'Drawing', value: 'drawing' },
          { title: 'Photography', value: 'photography' },
          { title: 'Other', value: 'other' },
        ],
      },
      initialValue: 'watercolour',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'altText',
      type: 'string',
      description: 'Describes the image for screen readers and when the image fails to load.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'dimensions',
      type: 'string',
      description: 'Physical size as displayed, e.g. 30 x 40 cm.',
    }),
    defineField({ name: 'yearCreated', type: 'number' }),
    defineField({ name: 'isFeatured', type: 'boolean', initialValue: false }),
    defineField({ name: 'price', type: 'number' }),
    defineField({
      name: 'tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'medium', media: 'image' } },
})
```

`studio/schemaTypes/siteSettings.ts`:

```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'artistName', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'tagline', type: 'string' }),
    defineField({ name: 'bio', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'profileImage', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'contactEmail', type: 'string', validation: (rule) => rule.email() }),
    defineField({
      name: 'priceCurrency',
      type: 'string',
      description: 'ISO 4217 code used in artwork JSON-LD offers, e.g. USD.',
      initialValue: 'USD',
    }),
  ],
})
```

`studio/schemaTypes/index.ts`:

```ts
import artwork from './artwork'
import siteSettings from './siteSettings'
import tag from './tag'

export const schemaTypes = [artwork, tag, siteSettings]
```

- [ ] **Step 7: Run the tests and make sure they pass**

Run: `cd studio && npm test`
Expected: PASS (8 tests).

- [ ] **Step 8: Register the schemas, add both datasets, and make siteSettings a singleton**

The Studio needs **one workspace per dataset**. With a single hardcoded `dataset`, the
Studio can only ever show `production`, while all local development happens against
`development` — the Studio then looks permanently empty and the seeded data is
unreachable without editing config.

Replace `studio/sanity.config.ts`:

```ts
import {defineConfig, type WorkspaceOptions} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

const SINGLETON_ID = 'siteSettings'

/**
 * One workspace per dataset so the Studio can switch between the artist's real
 * content and the seeded sample data without editing config or rebuilding.
 */
function workspaceForDataset(dataset: string, title: string): WorkspaceOptions {
  return {
    name: dataset,
    title,
    basePath: `/${dataset}`,
    projectId: 'nlwxmhc1',
    dataset,
    plugins: [
      structureTool({
        structure: (S) =>
          S.list()
            .title('Content')
            .items([
              S.listItem()
                .title('Site Settings')
                .id(SINGLETON_ID)
                .child(S.document().schemaType('siteSettings').documentId(SINGLETON_ID)),
              S.divider(),
              S.documentTypeListItem('artwork').title('Artwork'),
              S.documentTypeListItem('tag').title('Tags'),
            ]),
      }),
      visionTool({defaultDataset: dataset}),
    ],
    schema: {
      types: schemaTypes,
      // Site Settings is reachable only through its fixed-ID list item above.
      templates: (templates) => templates.filter(({schemaType}) => schemaType !== 'siteSettings'),
    },
  }
}

export default defineConfig([
  workspaceForDataset('production', 'Production'),
  workspaceForDataset('development', 'Development (sample data)'),
])
```

- [ ] **Step 9: Verify the Studio runs and the schema is valid**

```bash
cd studio && npx sanity dev
```

Open http://localhost:3333, confirm Site Settings, Artwork, and Tags appear, create one artwork by hand, then stop the server.

- [ ] **Step 10: Deploy the Studio**

```bash
cd studio && npx sanity deploy
```

Record the resulting `*.sanity.studio` URL in `README.md`.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add Sanity Studio with artwork, tag, and siteSettings schemas"
```

---

## Task 3: Sanity client, GROQ queries, and generated types

**Files:**
- Create: `lib/sanity/client.ts`, `lib/sanity/imageUrl.ts`, `lib/sanity/queries.ts`
- Modify: `studio/sanity.cli.ts` (typegen block), `studio/package.json` (typegen script)
- Generate: `lib/sanity/sanity.types.ts`
- Test: `tests/lib/sanity/imageUrl.test.ts`, `tests/lib/sanity/queries.test.ts`

**Interfaces:**
- Consumes: the field names produced by Task 2.
- Produces:
  - `client` — a configured `SanityClient`
  - `urlFor(source: SanityImageSource): ImageUrlBuilder`
  - `buildSrcSet(source: SanityImageSource, widths: number[]): string`
  - `ALL_ARTWORKS_QUERY`, `ARTWORK_SLUGS_QUERY`, `ARTWORK_BY_SLUG_QUERY`, `FEATURED_ARTWORKS_QUERY`, `SITE_SETTINGS_QUERY`
  - Generated types from `lib/sanity/sanity.types.ts`. **TypeGen names each result
    `<QUERY_CONST>_RESULT`** — `ALL_ARTWORKS_QUERY_RESULT`, `ARTWORK_BY_SLUG_QUERY_RESULT`,
    `SITE_SETTINGS_QUERY_RESULT` — not the PascalCase `…QueryResult` form.

- [ ] **Step 1: Write the failing tests**

`tests/lib/sanity/imageUrl.test.ts`:

```ts
import { buildSrcSet, urlFor } from '@/lib/sanity/imageUrl'

const imageSource = {
  _type: 'image' as const,
  asset: { _ref: 'image-abc123-800x600-jpg', _type: 'reference' as const },
}

describe('urlFor', () => {
  it('builds a Sanity CDN url for the configured project and dataset', () => {
    const url = urlFor(imageSource).width(400).url()

    expect(url).toContain('cdn.sanity.io')
    expect(url).toContain('nlwxmhc1')
    expect(url).toContain('w=400')
  })
})

describe('buildSrcSet', () => {
  it('emits one candidate per width, each tagged with its pixel width', () => {
    const srcSet = buildSrcSet(imageSource, [400, 800])
    const candidates = srcSet.split(', ')

    expect(candidates).toHaveLength(2)
    expect(candidates[0]).toMatch(/w=400.* 400w$/)
    expect(candidates[1]).toMatch(/w=800.* 800w$/)
  })

  it('requests auto format so the CDN can serve WebP or AVIF', () => {
    expect(buildSrcSet(imageSource, [400])).toContain('auto=format')
  })
})
```

`tests/lib/sanity/queries.test.ts`:

```ts
import {
  ALL_ARTWORKS_QUERY,
  ARTWORK_BY_SLUG_QUERY,
  ARTWORK_SLUGS_QUERY,
  FEATURED_ARTWORKS_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/lib/sanity/queries'

describe('GROQ queries', () => {
  it('selects artwork documents', () => {
    expect(ALL_ARTWORKS_QUERY).toContain('_type == "artwork"')
  })

  it('flattens slug and tag references so components never traverse Sanity internals', () => {
    expect(ALL_ARTWORKS_QUERY).toContain('"slug": slug.current')
    expect(ALL_ARTWORKS_QUERY).toContain('tags[]->')
  })

  it('looks artwork up by slug parameter', () => {
    expect(ARTWORK_BY_SLUG_QUERY).toContain('slug.current == $slug')
  })

  it('returns only slugs for generateStaticParams', () => {
    expect(ARTWORK_SLUGS_QUERY).toContain('slug.current')
    expect(ARTWORK_SLUGS_QUERY).not.toContain('image')
  })

  it('restricts featured artwork to the flagged documents', () => {
    expect(FEATURED_ARTWORKS_QUERY).toContain('isFeatured == true')
  })

  it('reads the site settings singleton by its fixed id', () => {
    expect(SITE_SETTINGS_QUERY).toContain('_id == "siteSettings"')
  })
})
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npm test -- tests/lib/sanity`
Expected: FAIL — cannot resolve `@/lib/sanity/imageUrl` and `@/lib/sanity/queries`.

- [ ] **Step 3: Write the client**

`lib/sanity/client.ts`:

```ts
import { createClient } from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'nlwxmhc1'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'development'
export const apiVersion = '2026-08-24'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Every read happens at build time, so the cached CDN edge is always the right choice.
  useCdn: true,
})
```

- [ ] **Step 4: Write the image URL helpers**

`lib/sanity/imageUrl.ts`:

```ts
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { dataset, projectId } from './client'

const builder = createImageUrlBuilder({ projectId, dataset })

export function urlFor(source: SanityImageSource) {
  return builder.image(source).auto('format').fit('max')
}

export function buildSrcSet(source: SanityImageSource, widths: number[]): string {
  return widths.map((width) => `${urlFor(source).width(width).url()} ${width}w`).join(', ')
}
```

- [ ] **Step 5: Write the queries**

`lib/sanity/queries.ts`:

```ts
import { defineQuery } from 'next-sanity'

const ARTWORK_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  description,
  medium,
  image,
  altText,
  dimensions,
  yearCreated,
  isFeatured,
  price,
  "tags": tags[]->{ _id, name, "slug": slug.current, category }
`

export const ALL_ARTWORKS_QUERY = defineQuery(`
  *[_type == "artwork" && defined(slug.current)]
    | order(coalesce(yearCreated, 0) desc, _createdAt desc) {${ARTWORK_FIELDS}}
`)

export const FEATURED_ARTWORKS_QUERY = defineQuery(`
  *[_type == "artwork" && isFeatured == true && defined(slug.current)]
    | order(coalesce(yearCreated, 0) desc, _createdAt desc)[0...6] {${ARTWORK_FIELDS}}
`)

export const ARTWORK_BY_SLUG_QUERY = defineQuery(`
  *[_type == "artwork" && slug.current == $slug][0] {${ARTWORK_FIELDS}}
`)

export const ARTWORK_SLUGS_QUERY = defineQuery(`
  *[_type == "artwork" && defined(slug.current)]{ "slug": slug.current }
`)

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0] {
    artistName, tagline, bio, profileImage, contactEmail, priceCurrency
  }
`)
```

- [ ] **Step 6: Run the tests and make sure they pass**

Run: `npm test -- tests/lib/sanity`
Expected: PASS (8 tests).

- [ ] **Step 7: Wire up typegen**

TypeGen is configured in the **Studio**, not the site. The Sanity CLI is a dependency of
`studio/`, and this is the layout Sanity documents. Paths are relative to `studio/`, so
they reach up into the site with `../`.

Merge a `typegen` block into `studio/sanity.cli.ts`:

```ts
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'nlwxmhc1',
    dataset: 'production',
  },
  deployment: {
    autoUpdates: true,
  },
  typegen: {
    enabled: true,
    path: '../{app,components,lib}/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../lib/sanity/sanity.types.ts',
    overloadClientMethods: true,
  },
})
```

Add the script to `studio/package.json`:

```json
{
  "typegen": "sanity schemas extract --force && sanity typegen generate"
}
```

Add `studio/schema.json` to `.gitignore` — it is a build intermediate regenerated from
the schema files.

- [ ] **Step 8: Generate the types and verify they compile**

```bash
cd studio && npm run typegen && cd ..
npx tsc --noEmit
```

Expected: `lib/sanity/sanity.types.ts` exists and contains `ALL_ARTWORKS_QUERY_RESULT`;
`tsc` reports no errors. TypeGen only discovers queries declared with `defineQuery`, so a
missing result type usually means a query was written as a bare template string.

Document the command in `README.md`, noting it must be re-run after any schema **or**
query change.

- [ ] **Step 9: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add Sanity client, GROQ queries, and generated query types"
```

---
## Task 4: Met Museum seed script

**Files:**
- Create: `scripts/metMuseum.ts`, `scripts/seed-gallery.ts`
- Modify: `package.json` (add `seed` script), `README.md`
- Test: `tests/scripts/metMuseum.test.ts`

**Interfaces:**
- Consumes: `client` from `lib/sanity/client.ts`; the `artwork` and `tag` field names from Task 2.
- Produces: `npm run seed -- --limit <n> [--clear]`. Pure exports from `scripts/metMuseum.ts`:
  - `toMedium(metMedium: string): ArtworkMedium`
  - `toYearCreated(objectDate: string): number | undefined`
  - `toSlug(title: string, objectId: number): string`
  - `toSeedArtwork(object: MetObject): SeedArtwork | null`
  - `assertSeedableDataset(dataset: string): void`

**Why this exists:** the gallery filter, the grid layout, and the responsive image path cannot be judged against three hand-entered rows. This produces realistic volume and realistic aspect ratios. It is a development tool only and never ships.

- [ ] **Step 1: Write the failing tests for the pure transforms**

`tests/scripts/metMuseum.test.ts`:

```ts
import {
  assertSeedableDataset,
  toMedium,
  toSeedArtwork,
  toSlug,
  toYearCreated,
} from '@/scripts/metMuseum'

describe('toMedium', () => {
  it.each([
    ['Watercolor on off-white wove paper', 'watercolour'],
    ['Watercolour and gouache', 'watercolour'],
    ['Gelatin silver print', 'photography'],
    ['Albumen photograph', 'photography'],
    ['Graphite on paper', 'drawing'],
    ['Pen and brown ink', 'drawing'],
    ['Bronze', 'other'],
  ])('maps %s to %s', (metMedium, expected) => {
    expect(toMedium(metMedium)).toBe(expected)
  })

  it('falls back to other for an empty medium', () => {
    expect(toMedium('')).toBe('other')
  })
})

describe('toYearCreated', () => {
  it.each([
    ['1856', 1856],
    ['ca. 1870', 1870],
    ['1863–65', 1863],
    ['dated 1901', 1901],
  ])('reads the first four-digit year from %s', (objectDate, expected) => {
    expect(toYearCreated(objectDate)).toBe(expected)
  })

  it('returns undefined when there is no year to read', () => {
    expect(toYearCreated('n.d.')).toBeUndefined()
  })
})

describe('toSlug', () => {
  it('lowercases, hyphenates, and suffixes the Met object id for uniqueness', () => {
    expect(toSlug('View of the Hudson River', 12345)).toBe('view-of-the-hudson-river-12345')
  })

  it('strips punctuation rather than encoding it', () => {
    expect(toSlug("A Study, No. 3 (Autumn)", 7)).toBe('a-study-no-3-autumn-7')
  })
})

describe('toSeedArtwork', () => {
  const metObject = {
    objectID: 42,
    title: 'Autumn Landscape',
    objectDate: 'ca. 1885',
    medium: 'Watercolor on paper',
    dimensions: '30 x 40 cm',
    primaryImage: 'https://images.metmuseum.org/full/42.jpg',
    artistDisplayName: 'Anonymous',
    isPublicDomain: true,
    tags: [{ term: 'Landscapes' }, { term: 'Trees' }],
  }

  it('maps a Met object onto our artwork shape', () => {
    expect(toSeedArtwork(metObject)).toEqual({
      title: 'Autumn Landscape',
      slug: 'autumn-landscape-42',
      medium: 'watercolour',
      dimensions: '30 x 40 cm',
      yearCreated: 1885,
      altText: 'Autumn Landscape by Anonymous',
      description: 'Watercolor on paper. Sample data from the Met Museum Open Access collection.',
      imageUrl: 'https://images.metmuseum.org/full/42.jpg',
      tagNames: ['landscapes', 'trees'],
    })
  })

  it('rejects objects with no image, since an artwork without one is unusable', () => {
    expect(toSeedArtwork({ ...metObject, primaryImage: '' })).toBeNull()
  })

  it('rejects objects that are not public domain', () => {
    expect(toSeedArtwork({ ...metObject, isPublicDomain: false })).toBeNull()
  })

  it('drops tag terms that are not plain letters and hyphens', () => {
    const withAwkwardTags = { ...metObject, tags: [{ term: 'Men' }, { term: 'Saint Peter, 1st c.' }] }
    expect(toSeedArtwork(withAwkwardTags)?.tagNames).toEqual(['men'])
  })
})

describe('assertSeedableDataset', () => {
  it('allows the development dataset', () => {
    expect(() => assertSeedableDataset('development')).not.toThrow()
  })

  it('refuses to touch production, which holds the artist real content', () => {
    expect(() => assertSeedableDataset('production')).toThrow(/production/i)
  })
})
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npm test -- tests/scripts/metMuseum.test.ts`
Expected: FAIL — cannot resolve `@/scripts/metMuseum`.

- [ ] **Step 3: Write the pure transforms**

`scripts/metMuseum.ts`:

```ts
export type ArtworkMedium = 'watercolour' | 'drawing' | 'photography' | 'other'

export type MetObject = {
  objectID: number
  title: string
  objectDate: string
  medium: string
  dimensions: string
  primaryImage: string
  artistDisplayName: string
  isPublicDomain: boolean
  tags: { term: string }[] | null
}

export type SeedArtwork = {
  title: string
  slug: string
  medium: ArtworkMedium
  dimensions: string
  yearCreated: number | undefined
  altText: string
  description: string
  imageUrl: string
  tagNames: string[]
}

const MEDIUM_PATTERNS: [RegExp, ArtworkMedium][] = [
  [/watercolou?r|gouache/i, 'watercolour'],
  [/photograph|albumen|gelatin silver|daguerreotype/i, 'photography'],
  [/drawing|graphite|charcoal|chalk|pen and|ink|pastel/i, 'drawing'],
]

export function toMedium(metMedium: string): ArtworkMedium {
  const match = MEDIUM_PATTERNS.find(([pattern]) => pattern.test(metMedium))
  return match ? match[1] : 'other'
}

export function toYearCreated(objectDate: string): number | undefined {
  const year = objectDate.match(/\d{4}/)
  return year ? Number(year[0]) : undefined
}

export function toSlug(title: string, objectId: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base}-${objectId}`
}

// The tag schema permits letters and hyphens only, so anything else is dropped
// rather than mangled into a tag nobody would search for.
const isUsableTagName = (name: string) => /^[a-z-]+$/.test(name)

export function toSeedArtwork(object: MetObject): SeedArtwork | null {
  if (!object.primaryImage || !object.isPublicDomain) return null

  return {
    title: object.title,
    slug: toSlug(object.title, object.objectID),
    medium: toMedium(object.medium),
    dimensions: object.dimensions,
    yearCreated: toYearCreated(object.objectDate),
    altText: `${object.title} by ${object.artistDisplayName || 'an unknown artist'}`,
    description: `${object.medium}. Sample data from the Met Museum Open Access collection.`,
    imageUrl: object.primaryImage,
    tagNames: (object.tags ?? [])
      .map(({ term }) => term.toLowerCase())
      .filter(isUsableTagName),
  }
}

export function assertSeedableDataset(dataset: string): void {
  if (dataset === 'production') {
    throw new Error(
      'Refusing to seed the production dataset — it holds real artwork. Set NEXT_PUBLIC_SANITY_DATASET=development.',
    )
  }
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test -- tests/scripts/metMuseum.test.ts`
Expected: PASS (17 tests).

- [ ] **Step 5: Write the CLI entrypoint**

The network and upload plumbing is not unit-tested — it is a thin shell over the transforms above, and mocking the Sanity asset pipeline would test the mock. It is verified by running it (Step 7).

`scripts/seed-gallery.ts`:

```ts
import { createClient } from 'next-sanity'
import { assertSeedableDataset, toSeedArtwork, type MetObject, type SeedArtwork } from './metMuseum'

const MET_API = 'https://collectionapi.metmuseum.org/public/collection/v1'
const SEARCH_TERM = 'landscape'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'nlwxmhc1'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'development'
const apiVersion = '2026-08-24'
const token = process.env.SANITY_WRITE_TOKEN

function parseArgs(argv: string[]) {
  const limitFlag = argv.indexOf('--limit')
  return {
    limit: limitFlag === -1 ? 20 : Number(argv[limitFlag + 1]),
    clear: argv.includes('--clear'),
  }
}

async function fetchCandidates(limit: number): Promise<MetObject[]> {
  const search = await fetch(`${MET_API}/search?hasImages=true&q=${SEARCH_TERM}`)
  const { objectIDs } = (await search.json()) as { objectIDs: number[] }

  const objects: MetObject[] = []
  for (const objectId of objectIDs) {
    if (objects.length >= limit) break
    const response = await fetch(`${MET_API}/objects/${objectId}`)
    if (response.ok) objects.push((await response.json()) as MetObject)
  }
  return objects
}

// Sanity's guidance is to let the Content Lake assign every _id. Re-runnability
// therefore comes from looking a document up before writing it, not from deriving
// a deterministic id from the slug or tag name.
async function resolveTagIds(client: ReturnType<typeof createClient>, names: string[]) {
  const wanted = [...new Set(names)]
  const existing: { _id: string; name: string }[] = await client.fetch(
    '*[_type == "tag" && name in $wanted]{ _id, name }',
    { wanted },
  )

  const idsByName = new Map(existing.map((tag) => [tag.name, tag._id]))

  for (const name of wanted) {
    if (idsByName.has(name)) continue
    const created = await client.create({
      _type: 'tag',
      name,
      slug: { _type: 'slug', current: name },
    })
    idsByName.set(name, created._id)
  }

  return idsByName
}

async function uploadArtwork(
  client: ReturnType<typeof createClient>,
  artwork: SeedArtwork,
  tagIds: Map<string, string>,
) {
  const image = await fetch(artwork.imageUrl)
  const asset = await client.assets.upload('image', Buffer.from(await image.arrayBuffer()), {
    filename: `${artwork.slug}.jpg`,
  })

  const fields = {
    title: artwork.title,
    slug: { _type: 'slug', current: artwork.slug },
    description: artwork.description,
    medium: artwork.medium,
    altText: artwork.altText,
    dimensions: artwork.dimensions,
    yearCreated: artwork.yearCreated,
    isFeatured: false,
    image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
    tags: artwork.tagNames.map((name) => ({
      _type: 'reference',
      _key: name,
      _ref: tagIds.get(name),
    })),
  }

  const existingId: string | null = await client.fetch(
    '*[_type == "artwork" && slug.current == $slug][0]._id',
    { slug: artwork.slug },
  )

  if (existingId) {
    await client.patch(existingId).set(fields).commit()
    return
  }

  await client.create({ _type: 'artwork', ...fields })
}

async function main() {
  assertSeedableDataset(dataset)
  if (!token) throw new Error('SANITY_WRITE_TOKEN is required. Add it to .env.local.')

  const { limit, clear } = parseArgs(process.argv)
  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

  if (clear) {
    console.log(`Deleting all artwork and tags in "${dataset}"...`)
    await client.delete({ query: '*[_type in ["artwork", "tag"]]' })
  }

  const candidates = await fetchCandidates(limit * 2)
  const artworks = candidates.map(toSeedArtwork).filter((a): a is SeedArtwork => a !== null).slice(0, limit)
  const tagIds = await resolveTagIds(client, artworks.flatMap((a) => a.tagNames))

  for (const artwork of artworks) {
    await uploadArtwork(client, artwork, tagIds)
    console.log(`Seeded: ${artwork.title}`)
  }
  console.log(`Done — ${artworks.length} artwork documents in "${dataset}".`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
```

- [ ] **Step 6: Add the npm script**

In `package.json`:

```json
{
  "seed": "tsx --env-file=.env.local scripts/seed-gallery.ts"
}
```

- [ ] **Step 7: Run the seed and verify it worked**

Create a write token at https://sanity.io/manage (project `nlwxmhc1` → API → Tokens → Editor), put it in `.env.local` as `SANITY_WRITE_TOKEN`, then:

```bash
npm run seed -- --limit 25
```

Expected: 25 "Seeded: ..." lines. Verify in the Studio (switch it to the `development` dataset) that artwork documents have images and tags.

Then confirm the guard works:

```bash
NEXT_PUBLIC_SANITY_DATASET=production npm run seed -- --limit 1 --clear
```

Expected: exits non-zero with the "Refusing to seed the production dataset" message and writes nothing.

- [ ] **Step 8: Document the commands**

Add to `README.md`: how to create the write token, `npm run seed -- --limit <n>`, `npm run seed -- --clear`, and an explicit note that seeding targets `development` and is blocked against `production`.

- [ ] **Step 9: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add Met Museum seed script for the development dataset"
```

---

## Task 5: SanityImage responsive component

**Files:**
- Create: `components/SanityImage.tsx`, `lib/sanity/types.ts`
- Test: `tests/components/SanityImage.test.tsx`

**Interfaces:**
- Consumes: `urlFor`, `buildSrcSet` from Task 3; generated types from `lib/sanity/sanity.types.ts`.
- Produces:
  - `lib/sanity/types.ts` exporting `Artwork`, `ArtworkTag`, `SiteSettings` — the domain aliases every component imports instead of reaching into generated query types.
  - `<SanityImage source alt widths? sizes? priority? className? />`

- [ ] **Step 1: Write the failing test**

`tests/components/SanityImage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import SanityImage from '@/components/SanityImage'

const source = {
  _type: 'image' as const,
  asset: { _ref: 'image-abc123-1200x900-jpg', _type: 'reference' as const },
}

describe('SanityImage', () => {
  it('renders an image with the supplied alt text', () => {
    render(<SanityImage source={source} alt="A watercolour of a river" />)
    expect(screen.getByRole('img', { name: 'A watercolour of a river' })).toBeInTheDocument()
  })

  it('offers the browser a candidate per requested width', () => {
    render(<SanityImage source={source} alt="Art" widths={[400, 800, 1200]} />)

    const srcSet = screen.getByRole('img').getAttribute('srcset')
    expect(srcSet).toContain('400w')
    expect(srcSet).toContain('800w')
    expect(srcSet).toContain('1200w')
  })

  it('lazy-loads by default so a long gallery does not fetch every image at once', () => {
    render(<SanityImage source={source} alt="Art" />)
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy')
  })

  it('loads eagerly when marked priority, for above-the-fold hero images', () => {
    render(<SanityImage source={source} alt="Art" priority />)
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'eager')
  })

  it('passes the sizes hint through', () => {
    render(<SanityImage source={source} alt="Art" sizes="(max-width: 600px) 100vw, 33vw" />)
    expect(screen.getByRole('img')).toHaveAttribute('sizes', '(max-width: 600px) 100vw, 33vw')
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test -- tests/components/SanityImage.test.tsx`
Expected: FAIL — cannot resolve `@/components/SanityImage`.

- [ ] **Step 3: Write the domain type aliases**

`lib/sanity/types.ts`:

```ts
import type { ALL_ARTWORKS_QUERY_RESULT, SITE_SETTINGS_QUERY_RESULT } from './sanity.types'

export type Artwork = ALL_ARTWORKS_QUERY_RESULT[number]
export type ArtworkTag = NonNullable<Artwork['tags']>[number]
export type SiteSettings = NonNullable<SITE_SETTINGS_QUERY_RESULT>
```

- [ ] **Step 4: Write the component**

`components/SanityImage.tsx`:

```tsx
import type { SanityImageSource } from '@sanity/image-url'
import { buildSrcSet, urlFor } from '@/lib/sanity/imageUrl'

const DEFAULT_WIDTHS = [400, 800, 1200, 1600]

type SanityImageProps = {
  source: SanityImageSource
  alt: string
  widths?: number[]
  sizes?: string
  priority?: boolean
  className?: string
}

export default function SanityImage({
  source,
  alt,
  widths = DEFAULT_WIDTHS,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  className,
}: SanityImageProps) {
  const fallbackWidth = widths[widths.length - 1]

  return (
    <img
      src={urlFor(source).width(fallbackWidth).url()}
      srcSet={buildSrcSet(source, widths)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
    />
  )
}
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `npm test -- tests/components/SanityImage.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add responsive SanityImage component with CDN srcset"
```

---

## Task 6: ArtworkCard and ArtworkGrid

**Files:**
- Create: `components/ArtworkCard.tsx`, `components/ArtworkGrid.tsx`
- Modify: `styles/style.scss`
- Test: `tests/components/ArtworkCard.test.tsx`, `tests/components/ArtworkGrid.test.tsx`

**Interfaces:**
- Consumes: `SanityImage` (Task 5), `Artwork` from `lib/sanity/types.ts`.
- Produces:
  - `<ArtworkCard artwork={artwork} priority?={boolean} />`
  - `<ArtworkGrid artworks={artworks} emptyMessage?={string} />`

- [ ] **Step 1: Write the failing tests**

`tests/components/ArtworkCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import ArtworkCard from '@/components/ArtworkCard'
import type { Artwork } from '@/lib/sanity/types'

const artwork = {
  _id: 'artwork-1',
  title: 'Autumn Landscape',
  slug: 'autumn-landscape',
  description: 'A study in ochre.',
  medium: 'watercolour',
  image: { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } },
  altText: 'Trees in autumn colours beside a river',
  dimensions: '30 x 40 cm',
  yearCreated: 2024,
  isFeatured: false,
  price: null,
  tags: [{ _id: 'tag-1', name: 'landscape', slug: 'landscape', category: null }],
} as unknown as Artwork

describe('ArtworkCard', () => {
  it('links to the artwork detail page', () => {
    render(<ArtworkCard artwork={artwork} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/artwork/autumn-landscape')
  })

  it('shows the title and the year', () => {
    render(<ArtworkCard artwork={artwork} />)
    expect(screen.getByText('Autumn Landscape')).toBeInTheDocument()
    expect(screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('uses the artwork alt text rather than the title, so the image is described', () => {
    render(<ArtworkCard artwork={artwork} />)
    expect(
      screen.getByRole('img', { name: 'Trees in autumn colours beside a river' }),
    ).toBeInTheDocument()
  })

  it('omits the year line entirely when the year is unknown', () => {
    render(<ArtworkCard artwork={{ ...artwork, yearCreated: null } as Artwork} />)
    expect(screen.queryByText(/2024/)).not.toBeInTheDocument()
  })
})
```

`tests/components/ArtworkGrid.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import ArtworkGrid from '@/components/ArtworkGrid'
import type { Artwork } from '@/lib/sanity/types'

const makeArtwork = (title: string, slug: string) =>
  ({
    _id: slug,
    title,
    slug,
    medium: 'watercolour',
    image: { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } },
    altText: title,
    yearCreated: 2024,
    tags: [],
  }) as unknown as Artwork

describe('ArtworkGrid', () => {
  it('renders one card per artwork', () => {
    render(<ArtworkGrid artworks={[makeArtwork('One', 'one'), makeArtwork('Two', 'two')]} />)
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('tells the visitor when there is nothing to show', () => {
    render(<ArtworkGrid artworks={[]} />)
    expect(screen.getByText(/no artwork/i)).toBeInTheDocument()
  })

  it('uses a caller-supplied empty message when given one', () => {
    render(<ArtworkGrid artworks={[]} emptyMessage="Nothing matches that search." />)
    expect(screen.getByText('Nothing matches that search.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npm test -- tests/components/ArtworkCard.test.tsx tests/components/ArtworkGrid.test.tsx`
Expected: FAIL — cannot resolve the two component modules.

- [ ] **Step 3: Write ArtworkCard**

`components/ArtworkCard.tsx`:

```tsx
import Link from 'next/link'
import SanityImage from '@/components/SanityImage'
import type { Artwork } from '@/lib/sanity/types'

type ArtworkCardProps = {
  artwork: Artwork
  priority?: boolean
}

export default function ArtworkCard({ artwork, priority = false }: ArtworkCardProps) {
  return (
    <article className="artwork-card">
      <Link href={`/artwork/${artwork.slug}`}>
        {artwork.image && (
          <SanityImage
            source={artwork.image}
            alt={artwork.altText ?? artwork.title ?? ''}
            widths={[300, 600, 900]}
            sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        )}
        <h3>{artwork.title}</h3>
        {artwork.yearCreated && <small>{artwork.yearCreated}</small>}
      </Link>
    </article>
  )
}
```

- [ ] **Step 4: Write ArtworkGrid**

`components/ArtworkGrid.tsx`:

```tsx
import ArtworkCard from '@/components/ArtworkCard'
import type { Artwork } from '@/lib/sanity/types'

type ArtworkGridProps = {
  artworks: Artwork[]
  emptyMessage?: string
}

export default function ArtworkGrid({
  artworks,
  emptyMessage = 'No artwork to show yet.',
}: ArtworkGridProps) {
  if (artworks.length === 0) return <p>{emptyMessage}</p>

  return (
    <div className="artwork-grid">
      {artworks.map((artwork, index) => (
        <ArtworkCard key={artwork._id} artwork={artwork} priority={index < 3} />
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `npm test -- tests/components/ArtworkCard.test.tsx tests/components/ArtworkGrid.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 6: Style the grid**

Append to `styles/style.scss`:

```scss
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
```

- [ ] **Step 7: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add ArtworkCard and ArtworkGrid components"
```

---

## Task 7: Gallery filter and search logic

**Files:**
- Create: `lib/gallery/filterArtworks.ts`
- Test: `tests/lib/gallery/filterArtworks.test.ts`

**Interfaces:**
- Consumes: `Artwork`, `ArtworkTag` from `lib/sanity/types.ts` (structurally — the functions are generic over the minimal shape, so tests need no Sanity fixtures).
- Produces:
  - `type ArtworkFilter = { searchTerm: string; tagSlugs: string[] }`
  - `const EMPTY_FILTER: ArtworkFilter`
  - `filterArtworks<T extends FilterableArtwork>(artworks: T[], filter: ArtworkFilter): T[]`
  - `collectTags<T extends FilterableArtwork>(artworks: T[]): FilterableTag[]`

**Behaviour contract** (replaces Django's `GalleryListView`):
- Empty search and no selected tags → everything, unchanged order.
- Search matches a substring of the title **or** of any tag name, case-insensitive.
- Selected tags are OR-ed: an artwork matches if it carries **any** selected tag.
- When both are active they are AND-ed: the artwork must satisfy the search **and** carry a selected tag.
- Whitespace-only search is treated as empty.

- [ ] **Step 1: Write the failing tests**

`tests/lib/gallery/filterArtworks.test.ts`:

```ts
import { collectTags, EMPTY_FILTER, filterArtworks } from '@/lib/gallery/filterArtworks'

const river = {
  title: 'River in Winter',
  tags: [
    { name: 'landscape', slug: 'landscape' },
    { name: 'winter-project', slug: 'winter-project' },
  ],
}
const portrait = { title: 'Portrait of a Friend', tags: [{ name: 'portrait', slug: 'portrait' }] }
const untagged = { title: 'Untitled Study', tags: null }
const artworks = [river, portrait, untagged]

describe('filterArtworks', () => {
  it('returns everything when nothing is filtered', () => {
    expect(filterArtworks(artworks, EMPTY_FILTER)).toEqual(artworks)
  })

  it('preserves the incoming order', () => {
    expect(filterArtworks(artworks, EMPTY_FILTER).map((a) => a.title)).toEqual([
      'River in Winter',
      'Portrait of a Friend',
      'Untitled Study',
    ])
  })

  it('matches a title substring regardless of case', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, searchTerm: 'WINTER' })).toEqual([river])
  })

  it('matches a tag name substring', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, searchTerm: 'landsc' })).toEqual([river])
  })

  it('treats a whitespace-only search as no search', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, searchTerm: '   ' })).toEqual(artworks)
  })

  it('returns nothing when the search matches nothing', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, searchTerm: 'sculpture' })).toEqual([])
  })

  it('keeps artwork carrying any of the selected tags', () => {
    const filtered = filterArtworks(artworks, {
      ...EMPTY_FILTER,
      tagSlugs: ['portrait', 'landscape'],
    })
    expect(filtered).toEqual([river, portrait])
  })

  it('excludes untagged artwork once any tag is selected', () => {
    expect(filterArtworks(artworks, { ...EMPTY_FILTER, tagSlugs: ['landscape'] })).toEqual([river])
  })

  it('requires both the search and the tag to match when both are active', () => {
    expect(
      filterArtworks(artworks, { searchTerm: 'river', tagSlugs: ['portrait'] }),
    ).toEqual([])
    expect(
      filterArtworks(artworks, { searchTerm: 'river', tagSlugs: ['landscape'] }),
    ).toEqual([river])
  })
})

describe('collectTags', () => {
  it('returns each distinct tag once, sorted by name', () => {
    expect(collectTags(artworks)).toEqual([
      { name: 'landscape', slug: 'landscape' },
      { name: 'portrait', slug: 'portrait' },
      { name: 'winter-project', slug: 'winter-project' },
    ])
  })

  it('handles artwork with no tags', () => {
    expect(collectTags([untagged])).toEqual([])
  })
})
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npm test -- tests/lib/gallery/filterArtworks.test.ts`
Expected: FAIL — cannot resolve `@/lib/gallery/filterArtworks`.

- [ ] **Step 3: Write the filter**

`lib/gallery/filterArtworks.ts`:

```ts
export type FilterableTag = { name: string | null; slug: string | null }
export type FilterableArtwork = { title: string | null; tags: FilterableTag[] | null }

export type ArtworkFilter = {
  searchTerm: string
  tagSlugs: string[]
}

export const EMPTY_FILTER: ArtworkFilter = { searchTerm: '', tagSlugs: [] }

function matchesSearch(artwork: FilterableArtwork, searchTerm: string): boolean {
  const needle = searchTerm.trim().toLowerCase()
  if (!needle) return true

  const haystack = [artwork.title, ...(artwork.tags ?? []).map((tag) => tag.name)]
  return haystack.some((value) => value?.toLowerCase().includes(needle) ?? false)
}

function matchesTags(artwork: FilterableArtwork, tagSlugs: string[]): boolean {
  if (tagSlugs.length === 0) return true
  return (artwork.tags ?? []).some((tag) => tag.slug !== null && tagSlugs.includes(tag.slug))
}

export function filterArtworks<T extends FilterableArtwork>(
  artworks: T[],
  filter: ArtworkFilter,
): T[] {
  return artworks.filter(
    (artwork) => matchesSearch(artwork, filter.searchTerm) && matchesTags(artwork, filter.tagSlugs),
  )
}

export function collectTags<T extends FilterableArtwork>(artworks: T[]): FilterableTag[] {
  const bySlug = new Map<string, FilterableTag>()

  for (const artwork of artworks) {
    for (const tag of artwork.tags ?? []) {
      if (tag.slug) bySlug.set(tag.slug, tag)
    }
  }

  return [...bySlug.values()].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test -- tests/lib/gallery/filterArtworks.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add pure artwork filter and search logic"
```

---

## Task 8: Gallery page with client-side browsing

**Files:**
- Create: `components/GalleryBrowser.tsx`, `app/gallery/page.tsx`
- Modify: `styles/style.scss`
- Test: `tests/components/GalleryBrowser.test.tsx`

**Interfaces:**
- Consumes: `filterArtworks`, `collectTags`, `EMPTY_FILTER` (Task 7); `ArtworkGrid` (Task 6); `ALL_ARTWORKS_QUERY` and `client` (Task 3).
- Produces: `<GalleryBrowser artworks={artworks} />` — a client component owning search and tag state.

**Why a client component:** the spec calls for filtering with no server round-trip. The page fetches everything at build time and hands the full list to a client island; nothing is fetched in the browser.

- [ ] **Step 1: Write the failing test**

`tests/components/GalleryBrowser.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GalleryBrowser from '@/components/GalleryBrowser'
import type { Artwork } from '@/lib/sanity/types'

const makeArtwork = (title: string, slug: string, tags: { name: string; slug: string }[]) =>
  ({
    _id: slug,
    title,
    slug,
    medium: 'watercolour',
    image: { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } },
    altText: title,
    yearCreated: 2024,
    tags,
  }) as unknown as Artwork

const artworks = [
  makeArtwork('River in Winter', 'river', [{ name: 'landscape', slug: 'landscape' }]),
  makeArtwork('Portrait of a Friend', 'portrait', [{ name: 'portrait', slug: 'portrait' }]),
]

describe('GalleryBrowser', () => {
  it('shows every artwork before any filtering', () => {
    render(<GalleryBrowser artworks={artworks} />)
    expect(screen.getByText('River in Winter')).toBeInTheDocument()
    expect(screen.getByText('Portrait of a Friend')).toBeInTheDocument()
  })

  it('narrows the grid as the visitor types', async () => {
    render(<GalleryBrowser artworks={artworks} />)

    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'river')

    expect(screen.getByText('River in Winter')).toBeInTheDocument()
    expect(screen.queryByText('Portrait of a Friend')).not.toBeInTheDocument()
  })

  it('narrows the grid when a tag is selected', async () => {
    render(<GalleryBrowser artworks={artworks} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'portrait' }))

    expect(screen.getByText('Portrait of a Friend')).toBeInTheDocument()
    expect(screen.queryByText('River in Winter')).not.toBeInTheDocument()
  })

  it('restores the full grid when the tag is deselected', async () => {
    render(<GalleryBrowser artworks={artworks} />)
    const tag = screen.getByRole('checkbox', { name: 'portrait' })

    await userEvent.click(tag)
    await userEvent.click(tag)

    expect(screen.getByText('River in Winter')).toBeInTheDocument()
    expect(screen.getByText('Portrait of a Friend')).toBeInTheDocument()
  })

  it('explains an empty result rather than showing a blank page', async () => {
    render(<GalleryBrowser artworks={artworks} />)

    await userEvent.type(screen.getByRole('searchbox', { name: /search/i }), 'sculpture')

    expect(screen.getByText(/no artwork matches/i)).toBeInTheDocument()
  })

  it('offers one checkbox per distinct tag', () => {
    render(<GalleryBrowser artworks={artworks} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test -- tests/components/GalleryBrowser.test.tsx`
Expected: FAIL — cannot resolve `@/components/GalleryBrowser`.

- [ ] **Step 3: Write the browser component**

`components/GalleryBrowser.tsx`:

```tsx
'use client'

import { useMemo, useState } from 'react'
import ArtworkGrid from '@/components/ArtworkGrid'
import { collectTags, EMPTY_FILTER, filterArtworks } from '@/lib/gallery/filterArtworks'
import type { Artwork } from '@/lib/sanity/types'

export default function GalleryBrowser({ artworks }: { artworks: Artwork[] }) {
  const [filter, setFilter] = useState(EMPTY_FILTER)

  const tags = useMemo(() => collectTags(artworks), [artworks])
  const visible = useMemo(() => filterArtworks(artworks, filter), [artworks, filter])

  const toggleTag = (slug: string) =>
    setFilter((current) => ({
      ...current,
      tagSlugs: current.tagSlugs.includes(slug)
        ? current.tagSlugs.filter((selected) => selected !== slug)
        : [...current.tagSlugs, slug],
    }))

  return (
    <>
      <search>
        <label htmlFor="artwork-search">Search artwork</label>
        <input
          id="artwork-search"
          type="search"
          placeholder="Title or tag"
          value={filter.searchTerm}
          onChange={(event) =>
            setFilter((current) => ({ ...current, searchTerm: event.target.value }))
          }
        />

        <fieldset className="tag-filter">
          <legend>Filter by tag</legend>
          {tags.map((tag) => (
            <label key={tag.slug}>
              <input
                type="checkbox"
                checked={filter.tagSlugs.includes(tag.slug!)}
                onChange={() => toggleTag(tag.slug!)}
              />
              {tag.name}
            </label>
          ))}
        </fieldset>
      </search>

      <ArtworkGrid artworks={visible} emptyMessage="No artwork matches that search." />
    </>
  )
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test -- tests/components/GalleryBrowser.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Write the gallery page**

`app/gallery/page.tsx`:

```tsx
import type { Metadata } from 'next'
import GalleryBrowser from '@/components/GalleryBrowser'
import { client } from '@/lib/sanity/client'
import { ALL_ARTWORKS_QUERY } from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Browse watercolour, drawing, and photography by Zenon Billings.',
}

export default async function GalleryPage() {
  const artworks = await client.fetch(ALL_ARTWORKS_QUERY)

  return (
    <>
      <h1>Gallery</h1>
      <GalleryBrowser artworks={artworks} />
    </>
  )
}
```

- [ ] **Step 6: Style the tag filter**

Append to `styles/style.scss`:

```scss
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
```

- [ ] **Step 7: Verify the page builds and renders real data**

```bash
npm run build && npx serve out -l 4173
```

Open http://localhost:4173/gallery/. Expected: the seeded artwork appears, typing narrows it, tag checkboxes narrow it. Confirm `out/gallery/index.html` contains the artwork titles — proving the data was baked in at build, not fetched in the browser.

- [ ] **Step 8: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add gallery page with client-side filter and search"
```

---
## Task 9: Artwork detail route with JSON-LD

**Files:**
- Create: `lib/seo/artworkJsonLd.ts`, `app/artwork/[slug]/page.tsx`
- Test: `tests/lib/seo/artworkJsonLd.test.ts`

**Interfaces:**
- Consumes: `ARTWORK_BY_SLUG_QUERY`, `ARTWORK_SLUGS_QUERY`, `SITE_SETTINGS_QUERY` (Task 3); `SanityImage` (Task 5); `Artwork`, `SiteSettings` (Task 5).
- Produces: `buildArtworkJsonLd(artwork: Artwork, settings: SiteSettings | null, siteUrl: string): Record<string, unknown>` and the statically-generated `/artwork/[slug]/` route.

**Note on `dimensions`:** modelled as a structured object (`width`, `height`, `unit`) and emitted as Schema.org `QuantitativeValue` with a UN/CEFACT `unitCode` (`CMT` for cm, `INH` for inches). The schema restricts units to those two so a `unitCode` can always be stated rather than free text. The Studio schema field is an object, not a string.

- [ ] **Step 1: Write the failing test**

`tests/lib/seo/artworkJsonLd.test.ts`:

```ts
import { buildArtworkJsonLd } from '@/lib/seo/artworkJsonLd'
import type { Artwork, SiteSettings } from '@/lib/sanity/types'

const artwork = {
  _id: 'artwork-1',
  title: 'Autumn Landscape',
  slug: 'autumn-landscape',
  description: 'A study in ochre.',
  medium: 'watercolour',
  image: { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } },
  altText: 'Trees in autumn',
  dimensions: '30 x 40 cm',
  yearCreated: 2024,
  isFeatured: false,
  price: null,
  tags: [],
} as unknown as Artwork

const settings = { artistName: 'Zenon Billings', priceCurrency: 'USD' } as SiteSettings

describe('buildArtworkJsonLd', () => {
  it('describes the artwork as a Schema.org VisualArtwork', () => {
    const jsonLd = buildArtworkJsonLd(artwork, settings, 'https://example.com')

    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('VisualArtwork')
    expect(jsonLd.name).toBe('Autumn Landscape')
    expect(jsonLd.artMedium).toBe('watercolour')
    expect(jsonLd.dateCreated).toBe(2024)
  })

  it('credits the artist from site settings', () => {
    const jsonLd = buildArtworkJsonLd(artwork, settings, 'https://example.com')
    expect(jsonLd.creator).toEqual({ '@type': 'Person', name: 'Zenon Billings' })
  })

  it('points at the canonical url for this artwork', () => {
    const jsonLd = buildArtworkJsonLd(artwork, settings, 'https://example.com')
    expect(jsonLd.url).toBe('https://example.com/artwork/autumn-landscape')
  })

  it('includes an absolute CDN image url', () => {
    const jsonLd = buildArtworkJsonLd(artwork, settings, 'https://example.com')
    expect(jsonLd.image).toContain('cdn.sanity.io')
  })

  it('omits offers when the artwork has no price', () => {
    expect(buildArtworkJsonLd(artwork, settings, 'https://example.com').offers).toBeUndefined()
  })

  it('adds an offer in the configured currency when priced', () => {
    const priced = { ...artwork, price: 250 } as Artwork
    expect(buildArtworkJsonLd(priced, settings, 'https://example.com').offers).toEqual({
      '@type': 'Offer',
      price: 250,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    })
  })

  it('falls back to USD when site settings are missing', () => {
    const priced = { ...artwork, price: 250 } as Artwork
    const offers = buildArtworkJsonLd(priced, null, 'https://example.com').offers as
      | Record<string, unknown>
      | undefined
    expect(offers?.priceCurrency).toBe('USD')
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test -- tests/lib/seo/artworkJsonLd.test.ts`
Expected: FAIL — cannot resolve `@/lib/seo/artworkJsonLd`.

- [ ] **Step 3: Write the JSON-LD builder**

`lib/seo/artworkJsonLd.ts`:

```ts
import { urlFor } from '@/lib/sanity/imageUrl'
import type { Artwork, SiteSettings } from '@/lib/sanity/types'

export function buildArtworkJsonLd(
  artwork: Artwork,
  settings: SiteSettings | null,
  siteUrl: string,
): Record<string, unknown> {
  const offers = artwork.price
    ? {
        '@type': 'Offer',
        price: artwork.price,
        priceCurrency: settings?.priceCurrency ?? 'USD',
        availability: 'https://schema.org/InStock',
      }
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    description: artwork.description ?? undefined,
    artMedium: artwork.medium ?? undefined,
    dateCreated: artwork.yearCreated ?? undefined,
    url: `${siteUrl}/artwork/${artwork.slug}`,
    image: artwork.image ? urlFor(artwork.image).width(1200).url() : undefined,
    creator: { '@type': 'Person', name: settings?.artistName ?? 'Zenon Billings' },
    offers,
  }
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test -- tests/lib/seo/artworkJsonLd.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Write the detail route**

`app/artwork/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import SanityImage from '@/components/SanityImage'
import { client } from '@/lib/sanity/client'
import { urlFor } from '@/lib/sanity/imageUrl'
import {
  ARTWORK_BY_SLUG_QUERY,
  ARTWORK_SLUGS_QUERY,
  SITE_SETTINGS_QUERY,
} from '@/lib/sanity/queries'
import { buildArtworkJsonLd } from '@/lib/seo/artworkJsonLd'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type ArtworkPageProps = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await client.fetch(ARTWORK_SLUGS_QUERY)
  return slugs.map(({ slug }) => ({ slug: slug! }))
}

export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params
  const artwork = await client.fetch(ARTWORK_BY_SLUG_QUERY, { slug })
  if (!artwork) return {}

  const image = artwork.image ? urlFor(artwork.image).width(1200).url() : undefined

  return {
    title: artwork.title ?? undefined,
    description: artwork.description ?? undefined,
    openGraph: {
      type: 'article',
      title: artwork.title ?? undefined,
      description: artwork.description ?? undefined,
      url: `${siteUrl}/artwork/${artwork.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: artwork.title ?? undefined,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params
  const [artwork, settings] = await Promise.all([
    client.fetch(ARTWORK_BY_SLUG_QUERY, { slug }),
    client.fetch(SITE_SETTINGS_QUERY),
  ])

  if (!artwork) notFound()

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildArtworkJsonLd(artwork, settings, siteUrl)),
        }}
      />

      {artwork.image && (
        <SanityImage
          source={artwork.image}
          alt={artwork.altText ?? artwork.title ?? ''}
          sizes="(max-width: 1024px) 100vw, 60vw"
          priority
        />
      )}

      <h1>{artwork.title}</h1>

      <dl>
        {artwork.medium && (
          <>
            <dt>Medium</dt>
            <dd>{artwork.medium}</dd>
          </>
        )}
        {artwork.dimensions && (
          <>
            <dt>Dimensions</dt>
            <dd>{artwork.dimensions}</dd>
          </>
        )}
        {artwork.yearCreated && (
          <>
            <dt>Year</dt>
            <dd>{artwork.yearCreated}</dd>
          </>
        )}
      </dl>

      {artwork.description && <p>{artwork.description}</p>}

      {artwork.tags && artwork.tags.length > 0 && (
        <p>
          {artwork.tags.map((tag) => (
            <mark key={tag._id}>{tag.name}</mark>
          ))}
        </p>
      )}
    </article>
  )
}
```

- [ ] **Step 6: Verify the routes are statically generated**

```bash
npm run build
ls out/artwork/
```

Expected: one directory per seeded artwork slug, each containing `index.html`. Confirm the JSON-LD is baked in:

```bash
grep -l 'VisualArtwork' out/artwork/*/index.html | head -1
```

- [ ] **Step 7: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add artwork detail route with Schema.org JSON-LD"
```

---

## Task 10: Home page

**Files:**
- Modify: `app/page.tsx`
- Test: covered by the E2E suite in Task 15 — this page is composition of already-tested components with no branching logic of its own.

**Interfaces:**
- Consumes: `FEATURED_ARTWORKS_QUERY`, `SITE_SETTINGS_QUERY` (Task 3); `ArtworkGrid` (Task 6).
- Produces: the `/` route.

- [ ] **Step 1: Write the home page**

`app/page.tsx`:

```tsx
import Link from 'next/link'
import ArtworkGrid from '@/components/ArtworkGrid'
import { client } from '@/lib/sanity/client'
import { FEATURED_ARTWORKS_QUERY, SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'

export default async function HomePage() {
  const [featured, settings] = await Promise.all([
    client.fetch(FEATURED_ARTWORKS_QUERY),
    client.fetch(SITE_SETTINGS_QUERY),
  ])

  return (
    <>
      <hgroup>
        <h1>{settings?.artistName ?? 'Zenon Billings'}</h1>
        {settings?.tagline && <p>{settings.tagline}</p>}
      </hgroup>

      <h2>Featured work</h2>
      <ArtworkGrid artworks={featured} emptyMessage="No featured artwork yet." />

      <p>
        <Link href="/gallery" role="button">
          View the full gallery
        </Link>
      </p>
    </>
  )
}
```

- [ ] **Step 2: Mark some seeded artwork as featured**

In the Studio (on the `development` dataset), set `isFeatured` on three artworks so the section has content to render.

- [ ] **Step 3: Verify it builds and renders**

```bash
npm run build && npx serve out -l 4173
```

Open http://localhost:4173/. Expected: the tagline, three featured pieces, and a working link to the gallery.

- [ ] **Step 4: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add home page with featured artwork"
```

---

## Task 11: About page

**Files:**
- Create: `app/about/page.tsx`
- Modify: none — `PortableText` comes from `next-sanity`, already installed
- Test: covered by the E2E suite in Task 15 — pure composition, no branching logic beyond null guards.

**Interfaces:**
- Consumes: `SITE_SETTINGS_QUERY` (Task 3); `SanityImage` (Task 5).
- Produces: the `/about` route. Bio content is editable in Sanity without a code change — preserving the original plan's "update text without touching code" property. Note that a static site still needs a rebuild to publish an edit; Task 15 documents the redeploy.

- [ ] **Step 1: Write the About page**

Do **not** install `@portabletext/react`. `next-sanity` re-exports `PortableText` (along
with `createClient` and `defineQuery`) and ships that package transitively; installing it
directly duplicates a dependency Sanity explicitly says to import from `next-sanity`.

`app/about/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { PortableText } from 'next-sanity'
import SanityImage from '@/components/SanityImage'
import { client } from '@/lib/sanity/client'
import { SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'About',
  description: 'About the artist.',
}

export default async function AboutPage() {
  const settings = await client.fetch(SITE_SETTINGS_QUERY)

  return (
    <>
      <h1>About {settings?.artistName ?? 'the artist'}</h1>

      {settings?.profileImage && (
        <SanityImage
          source={settings.profileImage}
          alt={`Portrait of ${settings.artistName ?? 'the artist'}`}
          widths={[300, 600]}
          sizes="(max-width: 600px) 100vw, 300px"
        />
      )}

      {settings?.bio ? <PortableText value={settings.bio} /> : <p>Biography coming soon.</p>}
    </>
  )
}
```

- [ ] **Step 2: Fill in Site Settings**

In the Studio (`development` dataset), populate `artistName`, `tagline`, `bio`, and `contactEmail` so the page has real content.

- [ ] **Step 3: Verify it builds and renders**

```bash
npm run build && npx serve out -l 4173
```

Open http://localhost:4173/about/. Expected: the bio renders as paragraphs.

- [ ] **Step 4: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add about page driven by Sanity site settings"
```

---

## Task 12: Contact submission adapter

**Files:**
- Create: `lib/contact/submitContactMessage.ts`, `lib/contact/web3FormsClient.ts`
- Test: `tests/lib/contact/submitContactMessage.test.ts`, `tests/lib/contact/web3FormsClient.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ContactMessage = { name: string; email: string; message: string }`
  - `type SubmitResult = { ok: true } | { ok: false; error: string }`
  - `type ContactSubmitter = (message: ContactMessage) => Promise<SubmitResult>`
  - `validateContactMessage(message: ContactMessage): string[]`
  - `submitViaWeb3Forms: ContactSubmitter`

**Why the split:** `web3FormsClient.ts` is the only file in the codebase that names the vendor. Swapping to Formspree, or to a self-hosted endpoint later, means writing one new file that satisfies `ContactSubmitter` and changing one import. The form component and its tests never reference the vendor.

- [ ] **Step 1: Write the failing validation test**

`tests/lib/contact/submitContactMessage.test.ts`:

```ts
import { validateContactMessage } from '@/lib/contact/submitContactMessage'

const valid = { name: 'Ada', email: 'ada@example.com', message: 'I love the river piece.' }

describe('validateContactMessage', () => {
  it('accepts a complete message', () => {
    expect(validateContactMessage(valid)).toEqual([])
  })

  it('requires a name', () => {
    expect(validateContactMessage({ ...valid, name: '  ' })).toContain('Please enter your name.')
  })

  it('requires a message', () => {
    expect(validateContactMessage({ ...valid, message: '' })).toContain(
      'Please enter a message.',
    )
  })

  it('requires an email that looks like an address', () => {
    expect(validateContactMessage({ ...valid, email: 'not-an-email' })).toContain(
      'Please enter a valid email address.',
    )
  })

  it('reports every problem at once rather than one at a time', () => {
    expect(validateContactMessage({ name: '', email: '', message: '' })).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test -- tests/lib/contact/submitContactMessage.test.ts`
Expected: FAIL — cannot resolve `@/lib/contact/submitContactMessage`.

- [ ] **Step 3: Write the interface and validation**

`lib/contact/submitContactMessage.ts`:

```ts
export type ContactMessage = {
  name: string
  email: string
  message: string
}

export type SubmitResult = { ok: true } | { ok: false; error: string }

export type ContactSubmitter = (message: ContactMessage) => Promise<SubmitResult>

const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateContactMessage(message: ContactMessage): string[] {
  const errors: string[] = []

  if (!message.name.trim()) errors.push('Please enter your name.')
  if (!LOOKS_LIKE_EMAIL.test(message.email.trim()))
    errors.push('Please enter a valid email address.')
  if (!message.message.trim()) errors.push('Please enter a message.')

  return errors
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test -- tests/lib/contact/submitContactMessage.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the failing Web3Forms client test**

`tests/lib/contact/web3FormsClient.test.ts`:

```ts
import { beforeEach, vi } from 'vitest'
import { submitViaWeb3Forms } from '@/lib/contact/web3FormsClient'

const message = { name: 'Ada', email: 'ada@example.com', message: 'Hello' }

describe('submitViaWeb3Forms', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY', 'test-key')
    vi.unstubAllGlobals()
  })

  it('posts the message and the access key to the Web3Forms endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
    vi.stubGlobal('fetch', fetchMock)

    await submitViaWeb3Forms(message)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.web3forms.com/submit')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toMatchObject({
      access_key: 'test-key',
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello',
    })
  })

  it('reports success when the service accepts the message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }),
    )
    expect(await submitViaWeb3Forms(message)).toEqual({ ok: true })
  })

  it('surfaces the service message when it rejects the submission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, message: 'Invalid access key' }),
      }),
    )
    expect(await submitViaWeb3Forms(message)).toEqual({ ok: false, error: 'Invalid access key' })
  })

  it('reports a friendly error when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await submitViaWeb3Forms(message)).toEqual({
      ok: false,
      error: 'Could not reach the mail service. Please try again.',
    })
  })

  it('fails loudly when the access key is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY', '')
    expect(await submitViaWeb3Forms(message)).toEqual({
      ok: false,
      error: 'The contact form is not configured yet.',
    })
  })
})
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `npm test -- tests/lib/contact/web3FormsClient.test.ts`
Expected: FAIL — cannot resolve `@/lib/contact/web3FormsClient`.

- [ ] **Step 7: Write the Web3Forms client**

`lib/contact/web3FormsClient.ts`:

```ts
import type { ContactSubmitter } from './submitContactMessage'

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

export const submitViaWeb3Forms: ContactSubmitter = async (message) => {
  // Public by design: Web3Forms access keys are meant to live in client-side code.
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY

  if (!accessKey) return { ok: false, error: 'The contact form is not configured yet.' }

  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Portfolio enquiry from ${message.name}`,
        name: message.name,
        email: message.email,
        message: message.message,
      }),
    })

    const result = (await response.json()) as { success: boolean; message?: string }

    if (!response.ok || !result.success) {
      return { ok: false, error: result.message ?? 'The message could not be sent.' }
    }

    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not reach the mail service. Please try again.' }
  }
}
```

- [ ] **Step 8: Run the tests and make sure they pass**

Run: `npm test -- tests/lib/contact`
Expected: PASS (10 tests).

- [ ] **Step 9: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add contact submission adapter with Web3Forms provider"
```

---

## Task 13: Contact page and form

**Files:**
- Create: `components/ContactForm.tsx`, `app/contact/page.tsx`
- Test: `tests/components/ContactForm.test.tsx`

**Interfaces:**
- Consumes: `ContactSubmitter`, `validateContactMessage` (Task 12); `SITE_SETTINGS_QUERY` (Task 3).
- Produces: `<ContactForm submit?={ContactSubmitter} />` — the submitter is injected so tests never touch the network, and defaults to `submitViaWeb3Forms`.

- [ ] **Step 1: Write the failing test**

`tests/components/ContactForm.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import ContactForm from '@/components/ContactForm'

const fillIn = async () => {
  await userEvent.type(screen.getByLabelText(/name/i), 'Ada')
  await userEvent.type(screen.getByLabelText(/email/i), 'ada@example.com')
  await userEvent.type(screen.getByLabelText(/message/i), 'I love the river piece.')
}

describe('ContactForm', () => {
  it('sends the message through the injected submitter', async () => {
    const submit = vi.fn().mockResolvedValue({ ok: true })
    render(<ContactForm submit={submit} />)

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(submit).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'I love the river piece.',
    })
  })

  it('confirms to the visitor that the message was sent', async () => {
    render(<ContactForm submit={vi.fn().mockResolvedValue({ ok: true })} />)

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/thank you/i)
  })

  it('shows validation errors and never calls the submitter', async () => {
    const submit = vi.fn()
    render(<ContactForm submit={submit} />)

    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/please enter your name/i)
    expect(submit).not.toHaveBeenCalled()
  })

  it('surfaces the error when the service rejects the message', async () => {
    render(<ContactForm submit={vi.fn().mockResolvedValue({ ok: false, error: 'Service down' })} />)

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Service down')
  })

  it('silently drops submissions that fill the honeypot, since only bots see it', async () => {
    const submit = vi.fn()
    const { container } = render(<ContactForm submit={submit} />)

    await fillIn()
    const honeypot = container.querySelector('input[name="botcheck"]') as HTMLInputElement
    await userEvent.type(honeypot, 'spam')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(submit).not.toHaveBeenCalled()
  })

  it('clears the fields after a successful send', async () => {
    render(<ContactForm submit={vi.fn().mockResolvedValue({ ok: true })} />)

    await fillIn()
    await userEvent.click(screen.getByRole('button', { name: /send/i }))
    await screen.findByRole('status')

    expect(screen.getByLabelText(/name/i)).toHaveValue('')
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test -- tests/components/ContactForm.test.tsx`
Expected: FAIL — cannot resolve `@/components/ContactForm`.

- [ ] **Step 3: Write the form**

`components/ContactForm.tsx`:

```tsx
'use client'

import { useState, type FormEvent } from 'react'
import {
  validateContactMessage,
  type ContactMessage,
  type ContactSubmitter,
} from '@/lib/contact/submitContactMessage'
import { submitViaWeb3Forms } from '@/lib/contact/web3FormsClient'

const EMPTY_MESSAGE: ContactMessage = { name: '', email: '', message: '' }

export default function ContactForm({ submit = submitViaWeb3Forms }: { submit?: ContactSubmitter }) {
  const [message, setMessage] = useState(EMPTY_MESSAGE)
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const update = (field: keyof ContactMessage) => (event: { target: { value: string } }) =>
    setMessage((current) => ({ ...current, [field]: event.target.value }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // A real visitor never sees this field, so anything in it came from a bot.
    if (honeypot) return

    const validationErrors = validateContactMessage(message)
    setErrors(validationErrors)
    if (validationErrors.length > 0) return

    setSending(true)
    const result = await submit(message)
    setSending(false)

    if (result.ok) {
      setSent(true)
      setMessage(EMPTY_MESSAGE)
    } else {
      setErrors([result.error])
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {sent && <p role="status">Thank you — your message is on its way.</p>}

      {errors.length > 0 && (
        <div role="alert">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <label htmlFor="contact-name">Name</label>
      <input id="contact-name" value={message.name} onChange={update('name')} />

      <label htmlFor="contact-email">Email</label>
      <input id="contact-email" type="email" value={message.email} onChange={update('email')} />

      <label htmlFor="contact-message">Message</label>
      <textarea id="contact-message" rows={5} value={message.message} onChange={update('message')} />

      <input
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        className="visually-hidden"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
      />

      <button type="submit" aria-busy={sending} disabled={sending}>
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
```

> **Implementer note:** the honeypot must be an `<input type="text">` for `userEvent.type` to work — change `type="checkbox"` to `type="text"` if the test cannot type into it. Keep `name="botcheck"`, which is the field name Web3Forms recognises.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test -- tests/components/ContactForm.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Hide the honeypot**

Append to `styles/style.scss`:

```scss
// Off-screen rather than display:none — some bots skip hidden inputs.
.visually-hidden {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
```

- [ ] **Step 6: Write the contact page**

`app/contact/page.tsx`:

```tsx
import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'
import { client } from '@/lib/sanity/client'
import { SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch about a piece, a commission, or an exhibition.',
}

export default async function ContactPage() {
  const settings = await client.fetch(SITE_SETTINGS_QUERY)

  return (
    <>
      <h1>Contact</h1>
      <p>Questions about a piece, a commission, or an exhibition are all welcome.</p>

      <ContactForm />

      {settings?.contactEmail && (
        <p>
          Prefer your own mail client?{' '}
          <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
        </p>
      )}
    </>
  )
}
```

- [ ] **Step 7: Configure the access key and send a real message**

Create a key at https://web3forms.com (it is emailed to the artist's address), add it to `.env.local` as `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`, then:

```bash
npm run build && npx serve out -l 4173
```

Submit the form at http://localhost:4173/contact/ and confirm the email arrives. Document the key setup in `README.md`.

- [ ] **Step 8: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add contact page with validated form and honeypot"
```

---

## Task 14: Sitemap, robots, and site-wide metadata

**Files:**
- Create: `app/sitemap.ts`, `app/robots.ts`
- Modify: `app/layout.tsx`
- Test: `tests/app/sitemap.test.ts`

**Interfaces:**
- Consumes: `ARTWORK_SLUGS_QUERY`, `client` (Task 3).
- Produces: `/sitemap.xml`, `/robots.txt`, and a `metadataBase` plus default OpenGraph tags on every page.

- [ ] **Step 1: Write the failing sitemap test**

`tests/app/sitemap.test.ts`:

```ts
import { vi } from 'vitest'

vi.mock('@/lib/sanity/client', () => ({
  client: { fetch: vi.fn().mockResolvedValue([{ slug: 'river' }, { slug: 'portrait' }]) },
}))

const { default: sitemap } = await import('@/app/sitemap')

describe('sitemap', () => {
  it('lists every static page', async () => {
    const urls = (await sitemap()).map((entry) => entry.url)

    expect(urls).toEqual(
      expect.arrayContaining([
        'http://localhost:3000',
        'http://localhost:3000/gallery',
        'http://localhost:3000/about',
        'http://localhost:3000/contact',
      ]),
    )
  })

  it('lists every artwork detail page', async () => {
    const urls = (await sitemap()).map((entry) => entry.url)

    expect(urls).toContain('http://localhost:3000/artwork/river')
    expect(urls).toContain('http://localhost:3000/artwork/portrait')
  })

  it('ranks the home page above the detail pages', async () => {
    const entries = await sitemap()
    const home = entries.find((entry) => entry.url === 'http://localhost:3000')
    const artwork = entries.find((entry) => entry.url.includes('/artwork/'))

    expect(home!.priority!).toBeGreaterThan(artwork!.priority!)
  })
})
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test -- tests/app/sitemap.test.ts`
Expected: FAIL — cannot resolve `@/app/sitemap`.

- [ ] **Step 3: Write the sitemap**

`app/sitemap.ts`:

**`export const dynamic = 'force-static'` is required.** Without it, `output: 'export'`
fails the build with *"export const dynamic … not configured on route"* — Next cannot
prove the route is static and refuses to collect its page data.

```ts
import type { MetadataRoute } from 'next'
import { client } from '@/lib/sanity/client'
import { ARTWORK_SLUGS_QUERY } from '@/lib/sanity/queries'

export const dynamic = 'force-static'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await client.fetch(ARTWORK_SLUGS_QUERY)

  const staticPages = [
    { url: siteUrl, priority: 1.0 },
    { url: `${siteUrl}/gallery`, priority: 0.9 },
    { url: `${siteUrl}/about`, priority: 0.6 },
    { url: `${siteUrl}/contact`, priority: 0.6 },
  ]

  const artworkPages = slugs.map(({ slug }) => ({
    url: `${siteUrl}/artwork/${slug}`,
    priority: 0.7,
  }))

  return [...staticPages, ...artworkPages]
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test -- tests/app/sitemap.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write robots.ts**

`app/robots.ts`:

**`export const dynamic = 'force-static'` is required.** Without it, `output: 'export'`
fails the build with *"export const dynamic … not configured on route"* — Next cannot
prove the route is static and refuses to collect its page data.

```ts
import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
```

- [ ] **Step 6: Add site-wide metadata defaults**

Replace the `metadata` export in `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Zenon Billings',
    template: '%s | Zenon Billings',
  },
  description: 'Watercolour, drawing, and photography by Zenon Billings.',
  openGraph: {
    type: 'website',
    siteName: 'Zenon Billings',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
}
```

- [ ] **Step 7: Verify both files are emitted**

```bash
npm run build
cat out/robots.txt
head -5 out/sitemap.xml
```

Expected: `robots.txt` references the sitemap; `sitemap.xml` contains every static page and every artwork URL.

- [ ] **Step 8: Commit**

```bash
npm run format && npm run lint && npm test
git add -A
git commit -m "feat: add sitemap, robots, and site-wide metadata defaults"
```

---

## Task 15: End-to-end suite, deployment, and documentation

**Files:**
- Create: `tests/e2e/gallery.spec.ts`, `tests/e2e/artwork.spec.ts`, `tests/e2e/contact.spec.ts`, `.node-version`
- Modify: `README.md`, `docs/execution_plan.md`
- Test: the E2E specs are themselves the test.

**Interfaces:**
- Consumes: every route built in Tasks 8–14.
- Produces: a green E2E suite, a live Cloudflare Pages deployment, and documentation matching reality.

- [ ] **Step 1: Write the gallery E2E spec**

`tests/e2e/gallery.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('gallery', () => {
  test('lists artwork and filters it in the browser', async ({ page }) => {
    await page.goto('/gallery/')

    const cards = page.locator('.artwork-card')
    const initialCount = await cards.count()
    expect(initialCount).toBeGreaterThan(1)

    const firstTitle = await cards.first().locator('h3').innerText()
    await page.getByRole('searchbox', { name: /search/i }).fill(firstTitle)

    await expect(cards).toHaveCount(1)
    await expect(cards.first().locator('h3')).toHaveText(firstTitle)
  })

  test('explains an empty result', async ({ page }) => {
    await page.goto('/gallery/')
    await page.getByRole('searchbox', { name: /search/i }).fill('zzzznotathing')

    await expect(page.getByText(/no artwork matches/i)).toBeVisible()
  })

  test('filters by tag', async ({ page }) => {
    await page.goto('/gallery/')

    const firstTag = page.getByRole('checkbox').first()
    await firstTag.check()

    await expect(page.locator('.artwork-card')).not.toHaveCount(0)
  })
})
```

- [ ] **Step 2: Write the artwork detail E2E spec**

`tests/e2e/artwork.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('artwork detail', () => {
  test('opens from the gallery and carries valid JSON-LD', async ({ page }) => {
    await page.goto('/gallery/')

    const title = await page.locator('.artwork-card h3').first().innerText()
    await page.locator('.artwork-card a').first().click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)

    const jsonLd = await page.locator('script[type="application/ld+json"]').innerText()
    const parsed = JSON.parse(jsonLd)
    expect(parsed['@type']).toBe('VisualArtwork')
    expect(parsed.name).toBe(title)
  })

  test('serves an image with responsive candidates', async ({ page }) => {
    await page.goto('/gallery/')
    await page.locator('.artwork-card a').first().click()

    const image = page.locator('article img').first()
    await expect(image).toHaveAttribute('srcset', /\d+w/)
    await expect(image).toHaveAttribute('alt', /.+/)
  })
})
```

- [ ] **Step 3: Write the contact E2E spec**

`tests/e2e/contact.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('contact form', () => {
  test('validates before sending anything', async ({ page }) => {
    let requestCount = 0
    await page.route('https://api.web3forms.com/**', async (route) => {
      requestCount += 1
      await route.fulfill({ json: { success: true } })
    })

    await page.goto('/contact/')
    await page.getByRole('button', { name: /send/i }).click()

    await expect(page.getByRole('alert')).toContainText(/please enter your name/i)
    expect(requestCount).toBe(0)
  })

  test('confirms a successful submission', async ({ page }) => {
    await page.route('https://api.web3forms.com/**', (route) =>
      route.fulfill({ json: { success: true } }),
    )

    await page.goto('/contact/')
    await page.getByLabel(/name/i).fill('Ada')
    await page.getByLabel(/email/i).fill('ada@example.com')
    await page.getByLabel(/message/i).fill('I love the river piece.')
    await page.getByRole('button', { name: /send/i }).click()

    await expect(page.getByRole('status')).toContainText(/thank you/i)
  })
})
```

- [ ] **Step 4: Run the E2E suite**

```bash
npm run build && npm run test:e2e
```

Expected: 7 tests pass. Playwright builds nothing itself — it serves the existing `out/`, so the build must run first.

- [ ] **Step 5: Verify the coverage floor**

```bash
npm run test:coverage
```

Expected: PASS with all four thresholds at or above 80%. If a threshold fails, add the missing tests — do not lower the threshold.

- [ ] **Step 6: Pin the Node version for Cloudflare**

`.node-version`:

```text
22
```

- [ ] **Step 7: Deploy to Cloudflare Pages**

In the Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git:

- **Build command:** `npm run build`
- **Build output directory:** `out`
- **Environment variables:** `NEXT_PUBLIC_SANITY_PROJECT_ID=nlwxmhc1`, `NEXT_PUBLIC_SANITY_DATASET=production`, `NEXT_PUBLIC_SITE_URL=https://<project>.pages.dev`, `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=<key>`

Note that production deploys read the `production` dataset while local development reads `development`.

- [ ] **Step 8: Add the Sanity CORS origin**

At https://sanity.io/manage → project `nlwxmhc1` → API → CORS origins, add the `*.pages.dev` origin. Reads happen at build time, but the Studio and any future preview need it.

- [ ] **Step 9: Verify the live site**

Visit the deployed URL and confirm: home renders featured work, gallery filters, an artwork detail page loads, `/sitemap.xml` and `/robots.txt` resolve, and the contact form delivers an email.

- [ ] **Step 10: Update the documentation**

`README.md` must now cover, at minimum:

- Prerequisites and `cp .env.example .env.local`
- Every npm script: `dev`, `build`, `test`, `test:watch`, `test:coverage`, `test:e2e`, `lint`, `format`, `format:check`, `typegen`, `seed`
- Studio commands: `cd studio && npx sanity dev`, `npx sanity deploy`, `npx sanity dataset create`
- The two-dataset convention and the production seed guard
- How to publish a content edit: edit in the Studio, then trigger a Cloudflare Pages redeploy (a static site does not pick up content changes until it is rebuilt)
- The deployed Studio URL and the Pages URL

`docs/execution_plan.md` must be updated to close both Open Decisions: Web3Forms for the contact form (with the reasoning), and starting on the free `*.pages.dev` subdomain. Also correct the "Astro static pages" cell in the feature-parity table to Next.js.

- [ ] **Step 11: Commit**

```bash
npm run format && npm run lint && npm test && npm run test:e2e
git add -A
git commit -m "test: add end-to-end suite and document deployment"
```

---

## Appendix: Spec Coverage

Every row of the spec's feature-parity map, and the task that delivers it.

| Spec requirement | Task |
|---|---|
| `Tag` → flat Sanity `tag` document | 2 |
| `Artwork` → Sanity `artwork` document with native image type | 2 |
| `GalleryListView` → build-time JSON + client-side filter/search | 3, 7, 8 |
| `ArtworkDetailView` + `VisualArtwork` JSON-LD | 9 |
| Django Admin → Sanity Studio | 2 |
| Home / About / Contact pages | 10, 11, 13 |
| About bio editable via `siteSettings` | 2, 11 |
| Contact form handler (Open Decision #1 → Web3Forms) | 12, 13 |
| SEO: OpenGraph/Twitter meta | 9, 14 |
| SEO: `sitemap.xml`, `robots.txt` | 14 |
| SEO: responsive images / srcset / lazy loading | 5 |
| `seed_gallery` → Node seed script with `--limit`/`--clear` | 4 |
| Vitest unit/component tests | throughout |
| Playwright E2E | 15 |
| ≥80% coverage | 1 (threshold), 15 (verification) |
| Cloudflare Pages deployment | 15 |
| Free `*.pages.dev` subdomain (Open Decision #2) | 15 |

**Deliberately out of scope**, per the spec's "Explicitly Dropped" and Phase 2 sections: Docker/self-hosting, Postgres/Gunicorn/Nginx, the blog `post` type, role-based permissions, and buying a custom domain. None of these block the plan; each can be added later without rework.
