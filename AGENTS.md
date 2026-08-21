# Project Rules & Standards

## 1. Development Philosophy
- **TDD (Test Driven Development)** is mandatory.
    - **RED**: Write a failing test for the feature/bug.
    - **GREEN**: Write the minimal code to pass the test.
    - **REFACTOR**: Improve code quality while keeping tests green.
- **MVP Logic**: Do not over-engineer. Stick to the simplest solution that satisfies the requirement.
- **Modularity**: Code should be split into small, modular chunks. Avoid monolithic components or functions.

## 2. Directory Structure
```text
zenon-billings/
├── app/              # Next.js App Router: routes, layouts, pages
├── components/       # Reusable UI components
├── lib/              # Sanity client, query helpers, utilities
├── public/           # Static assets
├── styles/           # Global CSS/SCSS (Pico.css customizations)
├── tests/            # Mirrors app/components structure
├── AGENTS.md
├── execution_plan.md
├── package.json
└── package-lock.json
```

## 3. Tech Stack Specifics
- **Content**: Sanity (headless CMS) — no app database; Sanity's Content Lake is the datastore.
- **Rendering**: Next.js, static export mode (`output: 'export'`) — no server at runtime.
- **Hosting**: Cloudflare Pages. No Docker, no containerization — there's no server to run.
- **Tagging**: flat Sanity `tag` documents referenced by `artwork` — no hierarchy library needed.
- **CSS**: `Pico.css` (SCSS), compiled via Next.js's built-in Sass support.
    - All customizations happen in `styles/style.scss`.
    - Do not write inline styles unless absolutely necessary.

## 4. Testing Guidelines
- Use `Vitest` for unit/component tests.
- Use `Playwright` for E2E tests.
- Test files should mirror the `app`/`components` structure (e.g. `tests/components/ArtworkCard.test.tsx`).

## 5. Coding Style
- **Formatter**: `Prettier`
- **Linter**: `ESLint`
- Follow programming best practices like KISS, DRY, SOLID, etc.
- The project should use and enforce a ubiquitous language.
- Names should be self-explanatory. Avoid cryptic or unambiguous naming.

### Functions/Components
- Functions and components should do one thing and one thing only.
- Keep them as short as possible: refactor until you can't refactor anymore.

### Comments
- Reserve comments for answering why, not what or how. Don't settle for a comment when a better name is what's needed.

## 6. Documentation Guidelines
- **Keep Documentation Updated**: All documentation (README, execution plans, etc.) must always be updated to reflect code changes.
- **Document All Commands**: No command (setup scripts, seed scripts, etc.) should be left undocumented.
