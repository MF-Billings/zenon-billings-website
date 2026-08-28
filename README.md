# Zenon Billings — Artist Portfolio

A statically-exported Next.js portfolio backed by Sanity, hosted on Cloudflare Pages.
There is no origin server: every page is built to static HTML at deploy time, and the
only runtime network call is the contact form posting to a third-party endpoint.

- **Content:** [Sanity](https://sanity.io) project `nlwxmhc1` (no application database)
- **Rendering:** Next.js App Router in `output: 'export'` mode
- **Styling:** [Pico.css](https://picocss.com) via SCSS
- **Hosting:** Cloudflare Pages

See `AGENTS.md` for project rules and `docs/execution_plan.md` for the architecture rationale.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the blanks
```

`.env.local` is gitignored and holds the only secret in the project, `SANITY_WRITE_TOKEN`.
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
`scripts/seed-gallery.ts` pulls public-domain artwork from the Met Museum Open Access API
into the `development` dataset.

First create a write token at [sanity.io/manage](https://www.sanity.io/manage) → project
`nlwxmhc1` → API → Tokens → **Editor**, and put it in `.env.local` as `SANITY_WRITE_TOKEN`.
That is the only secret in the project; never commit it.

| Command                      | What it does                                              |
| ---------------------------- | --------------------------------------------------------- |
| `npm run seed -- --limit 25` | Fetch 25 artworks, upload images, create/update documents |
| `npm run seed -- --clear`    | Delete all `artwork` and `tag` documents first, then seed |

The script **hard-refuses** to run when `NEXT_PUBLIC_SANITY_DATASET` is `production`, so a
stray `--clear` cannot destroy real content. Re-running is safe: artwork is matched by
slug and patched rather than duplicated.

## Commands

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

### Studio commands (run from `studio/`)

| Command                                                     | What it does                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `npm test`                                                  | Vitest schema tests                                                      |
| `npm run dev`                                               | Sanity Studio at http://localhost:3333                                   |
| `npx sanity documents query '<groq>' --dataset development` | Query content from the terminal                                          |
| `npm run typegen`                                           | Regenerate `lib/sanity/sanity.types.ts` from the schema and GROQ queries |
| `npx sanity deploy`                                         | Deploy the Studio to its hosted `*.sanity.studio` URL                    |
| `npx sanity dataset list`                                   | List datasets                                                            |

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

`lib/sanity/sanity.types.ts` is generated — never hand-edit it. `studio/` is a separate
npm package and is excluded from the root ESLint and Prettier runs.

### What the coverage floor measures

`npm run test:coverage` enforces 80% across statements, branches, functions, and lines.
Three things are excluded from the measurement, because Vitest cannot see them and
counting them would make the gate unreachable rather than strict:

- `lib/sanity/sanity.types.ts` — generated
- `app/**/page.tsx` and `app/layout.tsx` — server components that compose already-tested
  pieces around a build-time fetch; verified by the Playwright suite
- `scripts/seed-gallery.ts` — dev-only CLI; its pure logic lives in `scripts/metMuseum.ts`
  and is fully covered there, leaving only network and upload plumbing that a mock could
  not meaningfully test

Everything else counts. Do not widen this list to make a failing run pass.

## Notes on tooling choices

`@vitejs/plugin-react` is deliberately **not** installed. It exists to provide Fast Refresh
for a Vite dev server, which this project never runs, and its Babel 8 dependency chain
conflicts with the Babel 7 that `@sanity/codegen` (via `next-sanity`) requires. Vitest 4
transforms JSX through oxc with no plugin needed.
