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

| Command                   | What it does                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm test`                | Vitest schema tests                                                      |
| `npm run dev`             | Sanity Studio at http://localhost:3333                                   |
| `npm run typegen`         | Regenerate `lib/sanity/sanity.types.ts` from the schema and GROQ queries |
| `npx sanity deploy`       | Deploy the Studio to its hosted `*.sanity.studio` URL                    |
| `npx sanity dataset list` | List datasets                                                            |

Run `npm run typegen` after **any** schema or GROQ query change. TypeGen only discovers
queries declared with `defineQuery`, so a missing result type usually means a query was
written as a bare template string. Generated result types are named
`<QUERY_CONST>_RESULT`, e.g. `ALL_ARTWORKS_QUERY_RESULT`.

`lib/sanity/sanity.types.ts` is generated — never hand-edit it. `studio/` is a separate
npm package and is excluded from the root ESLint and Prettier runs.

## Notes on tooling choices

`@vitejs/plugin-react` is deliberately **not** installed. It exists to provide Fast Refresh
for a Vite dev server, which this project never runs, and its Babel 8 dependency chain
conflicts with the Babel 7 that `@sanity/codegen` (via `next-sanity`) requires. Vitest 4
transforms JSX through oxc with no plugin needed.
