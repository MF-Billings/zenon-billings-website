# Sanity Setup — Deviations from the Vendor-Supplied Agent Prompt

**Date:** 2026-08-24
**Applies to:** Sanity project `nlwxmhc1` ("Zenon Billings' Website")
**Related:** [`execution_plan.md`](execution_plan.md), [`superpowers/plans/2026-08-20-static-portfolio.md`](superpowers/plans/2026-08-20-static-portfolio.md)

## Why this document exists

Sanity's onboarding UI generated a prompt intended to be handed to a coding agent,
which would have set this project up in a specific way. Several of its statements did
not match this repository, so the setup was **run differently from what that prompt
described**. This is the record of what it said, what was actually true, what was done
instead, and why — so that nobody later reads the vendor prompt, sees that the repo
doesn't match it, and assumes something went wrong.

Nothing here indicates a fault in the setup. The prompt assumed a project layout that
Sanity's own scaffolder would have produced, which is not the layout this project has.

## The prompt as supplied

Reproduced verbatim:

> Set up Sanity using the `sanity-best-practices` skill's `getting-started` reference.
>
> If the skill can't be found, install it by running `npx skills add sanity-io/agent-toolkit --skill sanity-best-practices -y`. If the install fails, stop and ask me to run it.
>
> Context:
>
> - Project: Zenon Billings' Website (nlwxmhc1)
> - Dataset: production
> - Framework: Next.js
> - Project Type: Other
> - This is a monorepo: the current folder is the root, with the Studio in `studio` and the Next.js app in `web`
> - Connect Sanity to my new `web` app
> - First, confirm `studio` and `web` are both in your working directory. If not, stop and ask me to restart you from the `zenon-billings'-website` folder.
> - Keep the Studio standalone — do not embed it in the Next.js app

## Fact check

| #   | Statement                                         | Verdict               | Evidence                                                                                                                                                   |
| --- | ------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Project is `nlwxmhc1`                             | Correct               | `studio/sanity.config.ts`; `npx sanity projects list`                                                                                                      |
| 2   | Framework is Next.js                              | Correct               | root `package.json` → `next@16.3.1`                                                                                                                        |
| 3   | Keep the Studio standalone, do not embed          | Correct               | Matches the decision already recorded in `execution_plan.md`. The skill's own `project-structure.md` labels the embedded Studio "Legacy — Not Recommended" |
| 4   | Dataset is `production`                           | Incomplete            | Two datasets exist: `production` and `development`. `npx sanity dataset list` confirms both                                                                |
| 5   | The Next.js app is in `web`                       | **Incorrect**         | No `web/` directory exists. The Next.js app lives at the repository root (`app/`, `components/`, root `package.json`)                                      |
| 6   | Stop unless `studio` and `web` are both present   | **Incorrect premise** | `web/` was never intended to exist here. Followed literally, this halts setup over the absence of a directory that is not part of this project's design    |
| 7   | Restart from the `zenon-billings'-website` folder | **Incorrect**         | No such directory. The repository is `zenon-billings`                                                                                                      |
| 8   | Install the skill via `npx skills add …`          | Unnecessary           | Already installed at `~/.claude/skills/sanity-best-practices`. Its reference files were read directly; no install command from pasted text was executed    |

### Root cause of statements 5–7

Sanity's `sanity new` scaffolder creates a fresh monorepo with the Studio in `sanity/`
and a **new** Next.js app in `web/`. The generated prompt describes that outcome. This
project inverted the order — the Next.js app was scaffolded first and already occupied
the repository root, so the Studio was added beside it in `studio/`.

Both shapes are explicitly supported. `project-structure.md` in the skill documents the
side-by-side monorepo as the recommended pattern with a frontend, and the folder names
are not load-bearing.

## Actual layout

```text
zenon-billings/            <- repo root, and the Next.js app
├── app/                   <- App Router routes
├── components/
├── lib/
├── styles/
├── tests/
├── studio/                <- standalone Sanity Studio, own package.json
│   ├── sanity.config.ts
│   ├── sanity.cli.ts
│   ├── schemaTypes/
│   └── tests/
└── docs/
```

The vendor prompt's `web/` maps to the repository root. There is no other difference in
substance: the Studio is standalone, exactly as the prompt required.

## How setup was actually run

### The scaffolder fails inside a Next.js project

Running the documented command from the repository root:

```bash
npm create sanity@latest -- --project nlwxmhc1 --dataset production \
  --template clean --typescript --output-path studio
```

prompts _"Would you like to add configuration files for a Sanity project in this Next.js
folder?"_. That prompt offers to **embed** the Studio in the Next.js app — the opposite
of the prompt's own final instruction, and incompatible with this project's
`output: 'export'` build.

Answering **No** — the correct answer — causes the CLI to fail:

```text
Error: Failed to read ".../zenon-billings/studio/package.json"
Caused by: ENOENT: no such file or directory
```

It aborts while looking for a `studio/package.json` it never created. Nothing was
written; `git status` was clean afterwards.

### Workaround used

Scaffold from a directory **outside** the Next.js project, so the CLI does not detect a
framework, then move the result in:

```bash
cd <empty-temp-dir>
npm create sanity@latest -- --project nlwxmhc1 --dataset production \
  --template clean --typescript --output-path studio \
  --package-manager npm --no-skills
mv studio /path/to/zenon-billings/studio     # after deleting studio/.git
```

The same class of problem affected `create-next-app`, which refuses to scaffold into a
directory containing `AGENTS.md`; that was solved the same way. See the Task 1
"Deviations" table in the implementation plan.

**Alternative, untested here:** the CLI exposes flags that answer the Next.js prompts
non-interactively — `--no-nextjs-add-config-files`, `--no-nextjs-embed-studio`,
`--no-nextjs-append-env`. These may avoid the temp-directory dance, but were discovered
after the workaround already succeeded.

### Steps taken

1. Scaffolded the standalone Studio into `studio/` (clean template, TypeScript).
2. Created the second dataset: `npx sanity dataset create development`.
3. Added Vitest to the Studio package with its own `vitest.config.ts` — without one,
   Vitest walks up and picks up the site's jsdom config, which does not apply to schemas.
4. Wrote `artwork`, `tag`, and `siteSettings` schemas test-first (8 tests).
5. Registered `siteSettings` as a singleton via the structure builder.
6. Verified with `npx sanity build` and `npx tsc --noEmit`.

## Corrections the skill produced

Reading `sanity-best-practices` surfaced four points where the project's implementation
plan was wrong. All four have been applied to the plan.

| #   | Plan said                                                                         | Corrected to                                                                                                                     | Reason                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | TypeGen configured via a root `sanity-typegen.json`                               | A `typegen` block in `studio/sanity.cli.ts`, run with `sanity schemas extract --force && sanity typegen generate` from `studio/` | The documented path. Also better suited here: the Sanity CLI is already a dependency of `studio/`, not of the root package                                            |
| 2   | `apiVersion: '2024-10-01'`                                                        | `apiVersion: '2026-08-24'`                                                                                                       | Guidance is to hard-code the date the integration was written. The old pin silently opts out of newer API behaviour                                                   |
| 3   | Install `@portabletext/react` for the About page                                  | Import `PortableText` from `next-sanity`                                                                                         | Verified: `next-sanity` re-exports `PortableText`, `createClient`, and `defineQuery`, and ships `@portabletext/react` transitively. The separate install is redundant |
| 4   | Seed script uses deterministic IDs (`_id: 'artwork-<slug>'`, `_id: 'tag-<name>'`) | Query for existing documents, then create, reusing the returned `_id` values                                                     | Violates a documented Global Rule: "Let Sanity generate `_id` values … Do not create deterministic UUIDs, slug-derived IDs, or legacy-system IDs"                     |

Item 4 was a deliberate choice originally — deterministic IDs make the seed script
idempotent, so re-running does not duplicate content. Query-then-create preserves that
property while staying inside the rule, so the exception was not worth arguing for.

## Deliberately not done

- **`npx sanity schemas deploy`** — uploads the schema so Sanity's MCP server can see
  the document types. This project does not use MCP; the site reads content over the
  normal client at build time. Harmless to run, but not required.
- **Anything involving a `web/` directory** — see the fact check above.
- **The `npx skills add …` install** — the skill was already present.

## Outstanding actions for the project owner

- [ ] **Rotate the Sanity CLI auth token.** During setup, `npx sanity debug --secrets`
      was run, which printed the account auth token into an agent transcript. Rotate it:
      `npx sanity@latest logout && npx sanity@latest login`.
- [ ] **Deploy the Studio** — `cd studio && npx sanity deploy` (requires choosing a
      hostname interactively). Record the resulting URL in `README.md`.
- [ ] **Populate Site Settings** in the `development` dataset (`artistName`, `tagline`,
      `bio`, `publicContactAlias`). The Home and About pages render these and have
      nothing to show until they exist. `publicContactAlias` is published in plain sight
      on the contact page — it takes a forwarding alias, never a personal inbox. See
      "The published contact address" in `README.md`.
