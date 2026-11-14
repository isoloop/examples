# Architecture decision records

Decisions about this repo: the site, the examples and the design system. Decisions about Isoloop itself are in the library repo's [ADRs](https://github.com/isoloop/isoloop/tree/main/docs/adr).

Each has a status:

- **Proposed:** a recommended default, open to review.
- **Accepted:** binding; change it only with a new ADR that supersedes it.
- **Rejected / Superseded:** kept for history.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-what-this-repo-is.md) | `isoloop/examples` renamed to `isoloop/web`: the site, examples and design system, built on the published packages; the library repo keeps the library and its docs; served at `isoloop.dev` with sections as paths; one Pages build per tag (`markets-v*`, `plant-v*`, `basic-v*`, `site-v*`); ADR 0009's toolchain by reference | Accepted |
| [0002](0002-site-build.md) | `apps/site`: Vite multi-page, plain HTML and CSS, no UI, CSS or template framework; meta CSP `default-src 'self'`, every request same-origin, JS only as enhancement; only basic runs live (iframe), plant and markets as cards; hub from each app's `example.json`; diagrams fetched from `isoloop/isoloop` at a pinned sha; figures copied with their tag; M4 docs behind an interface we own; the theme in `localStorage`, switched live across same-origin frames; decision 1 amended by 0003; amended 2026-11-14 for the approved design (`/features/`, the new landing order, demos drawn from basic's real activity over origin-checked `postMessage`, markets figures until M3f) | Accepted |
| [0003](0003-design-system.md) | `packages/ui` (private, unversioned): Preact components rendered at build time only, behind our own `render()`, no framework JS in the browser; tokens in CSS with the `--ui-` prefix (primitives and semantic layers), colours in `oklch()`, light and dark through `data-theme`; `ui-` classes in `@layer ui`; the full header on the site and basic, a fixed-dark bar on the dashboards; AA contrast by test; the logo in `brand/`; amends 0002 decision 1; amended 2026-11-14 for the approved design (Archivo self-hosted, concept A's palette with `--ui-part-*` colours, a gutter layout, motion only in the live demos, a sticky header, the sun/moon switch) | Accepted |

Template: **Context** (the forces at play), **Decision**, **Consequences** (good and bad), **Alternatives considered**.
