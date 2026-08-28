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
