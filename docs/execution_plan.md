# Implementation Plan - Static Portfolio (Zenon Billings)

Rebuild of `artist-portfolio-montana` (Django) as a static site + headless CMS,
to get free/simple hosting with no server to run or defend. This doc maps
each existing Django feature to its equivalent in the new stack. Source of
truth for _why_ this stack was chosen is the "artist portfolio static site"
conversation that produced this plan (Django's DDoS/cost/uptime concerns are
structurally avoided by having no origin server at all).

## Decisions Confirmed

> [!NOTE]
> **Stack**: Next.js (static export mode) + Sanity (headless CMS) +
> Cloudflare Pages (hosting) + Cloudflare Registrar (domain).
> **Why Sanity over Strapi**: Sanity's free tier is fully managed (no server
> to run, ever). Self-hosted Strapi would still need a server (Docker/VPS/
> home PC) — it doesn't remove the hosting problem this rewrite exists to
> avoid.
> **Why Cloudflare Pages**: unlimited bandwidth on free tier, no
> commercial-use restriction (unlike Vercel Hobby, which matters since
> `price` is a planned field), free subdomain (`*.pages.dev`) with no domain
> purchase required to start, and it's the same account already used for the
> domain registrar.
> **Hosting cost**: $0/month. Domain optional for now (using free `.pages.dev`
> subdomain); buy a real domain via Cloudflare Registrar (~$10/yr) whenever
> ready.

## Feature Parity Map

| Django (`artist-portfolio-montana`)                                                                                   | Static + Sanity equivalent                                                                                                                                                                                | Notes                                                                                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tag` model (treebeard, hierarchical)                                                                                 | Sanity `tag` document type, flat (name + optional `category` string)                                                                                                                                      | Original tag examples (painting, watercolour, winter-project-2025, landscape) don't need deep nesting — flattening is a deliberate simplification, not a gap. Revisit only if a real hierarchy need shows up. |
| `Artwork` model (title, image, description, medium, dimensions, year_created, is_featured, alt_text, price, tags M2M) | Sanity `artwork` document: same fields, `image` uses Sanity's native image type, `tags` is an array of references                                                                                         | Sanity's image type includes hotspot/crop and on-the-fly CDN resizing — replaces `django-imagekit` with no custom code.                                                                                       |
| `GalleryListView` (filter by tag + search title/tag substring)                                                        | Build-time JSON of all artwork metadata, client-side JS filter/search on the gallery page                                                                                                                 | No server round-trip needed; fine at portfolio scale (tens–low hundreds of items).                                                                                                                            |
| `ArtworkDetailView` + Schema.org `VisualArtwork` JSON-LD                                                              | Next.js dynamic route (`app/artwork/[slug]`) with `generateStaticParams`, JSON-LD via the Metadata API; prev/next buttons walk `ARTWORK_ORDER` (optionally narrowed to the gallery's `?tags=` filter) | Same SEO payload, computed at build instead of request time.                                                                                                                                                  |
| Django Admin (customized, thumbnail previews)                                                                         | Sanity Studio                                                                                                                                                                                             | Free, hosted or self-served from the same repo; thumbnails are native, no custom admin code.                                                                                                                  |
| Core app: Home / About / Contact                                                                                      | Static Home and About pages; Contact is a section of the Home page (`/#contact`), not a route. About bio content pulled from a Sanity `siteSettings` singleton so it's still editable without a redeploy | Keeps "update text without touching code" property from the original plan.                                                                                                                                    |
| Contact form (→ artist alias)                                                                                         | **Decided:** Web3Forms, behind the provider-agnostic `ContactSubmitter` adapter. A Pages Function would have reintroduced the origin server this architecture removes                                     | The destination address stays server-side with the provider; the page carries only a public access key. Rationale in `notes.md`.                                                                              |
| SEO: OpenGraph/Twitter meta, JSON-LD, sitemap.xml, robots.txt, responsive images/srcset, lazy loading                 | Next.js Metadata API + `sitemap.ts`/`robots.ts` route conventions + Sanity's image URL builder for `srcset`                                                                                               | Generally less custom code than the Django version — this is Next.js/Sanity's default lane.                                                                                                                   |
| `seed_gallery` management command (Met Museum Open Access API)                                                        | Equivalent one-off script (Node, using Sanity's client) with the same `--limit`/`--clear`-style options, pushing sample documents into Sanity                                                             | Not part of the deployed site — a dev/setup tool only.                                                                                                                                                        |
| Testing: pytest (unit/integration) + Playwright E2E + factory_boy                                                     | Vitest (or similar) for component/logic tests + Playwright E2E (same tool, same philosophy)                                                                                                               | TDD discipline carries over; tooling changes with the language.                                                                                                                                               |
| Phase 2 (Django plan): Blog CRUD, role-based permissions, S3 migration                                                | Blog = new Sanity `post` document type (natural fit). Roles = Sanity's built-in seat roles (free tier supports non-admin seats). S3 migration = moot, Sanity's asset CDN already handles storage/delivery | All three get easier, not harder, in this stack.                                                                                                                                                              |

## Explicitly Dropped

- **Docker / self-hosting / Linux server ops** — the original deploy plan's
  stated learning goal. This stack has no server to containerize. If that
  hands-on learning still matters, treat it as a separate side exercise, not
  part of this project.
- **Postgres/SQLite, Gunicorn, Nginx, Cloudflare Tunnel** — all replaced by
  "no server," per above.

## Testing Guidelines (carried over from AGENTS.md)

- TDD: red/green/refactor, same as the Django project.
- Test files mirror source structure.
- Coverage target: same >=80% bar as the original plan.

## Open Decisions (resolve before/while building)

1. ~~Contact form handler (Cloudflare Pages Functions vs. third-party service).~~
   **Resolved 2026-08-30:** Web3Forms — see `notes.md`, "Why Web3Forms and not an API route".
2. Whether to buy a real domain now or start on the free `*.pages.dev`
   subdomain (plan supports either with no rework). A real domain is also what makes a
   Cloudflare Email Routing alias possible for the published contact address.
