# ADR 0001: isoloop/web, the website and examples repo

- **Status:** Accepted
- **Date:** 2026-11-14
- **Answers:** where Isoloop's website, examples and design system live, at which address, how they deploy, and which toolchain rules apply. Grilled 2026-11-14 from the website idea written after `plant-v0.1.0`.

## Context

Today the org has two repositories:

- **`isoloop/isoloop`** holds the library. Its Pages serve the four-loops demo at `isoloop.github.io/isoloop/`.
- **`isoloop/examples`** holds the markets and plant dashboards. They install `@isoloop/*` from npm, like any app. One Pages build of every app is served at `isoloop.github.io/examples/`, deployed from `markets-v*` and `plant-v*` tags.

Isoloop needs a front door: a landing page, a "how it works" page and an examples hub now, and the docs site in M4. The forces:

- **The library repo should hold the library.** Packages, tests, benches, and the docs that change with the code: guides, ADRs, design docs, diagrams checked against the code. A landing page and a design system have nothing to do with Isoloop's own design.
- **One site, not two.** The landing page and the examples hub must look like the same site. A visitor who goes from one to the other shouldn't feel they've left.
- **One design system, no copies.** A copy in each repo needs syncing and a drift check, and can still be out of date between the two.
- **Stable addresses before 0.1.** The launch post will link the site. Nothing is announced yet, so moving addresses now is cheap, and after the launch it isn't.
- **GitHub Pages ties the root to a repo name.** `isoloop.github.io/` is served only by a repo named `isoloop.github.io`. Any other repo is served under `/<name>/`, unless it has a custom domain.
- **The domain exists.** `isoloop.dev` is owned, and its mail is in use, so the website's DNS records must leave the mail records alone.
- **Own the stack** (as in `isoloop/isoloop` ADR 0009). Few dependencies, each one replaceable.

## Decision

### 1. Two repos, split by "is it the library?"

| Repo | Holds |
| --- | --- |
| `isoloop/isoloop` | The packages, their tests and benches, and the docs that change with the code: `docs/guide`, `docs/adr`, `docs/design`, and the core diagrams in `docs/diagrams` with their drift test. |
| `isoloop/web` | Everything web-facing that is built on the published `@isoloop` packages: the site, the examples, the design system, and later the M4 docs site build. |

`web` uses Isoloop only as an npm dependency, as any app would. What it shows from the library repo it fetches at a fixed point: the diagrams at a pinned sha now, and the guides and TSDoc at the release tag in M4. Bumping a pin is a reviewed PR in `web`.

### 2. `isoloop/examples` is renamed to `isoloop/web`

The rename keeps the history, shas, tags, PRs and the `github-pages` environment, and GitHub redirects the old repo URLs, so links at fixed shas keep working. No org repo may be named `examples` again, since a new repo with the old name takes over those redirects.

### 3. Layout

| Folder | What it is |
| --- | --- |
| `apps/site` | The landing page, how it works, and the examples hub ([ADR 0002](0002-site-build.md)) |
| `apps/basic` | The smallest example: four isolates, two on their own workers and two sharing a pool. It replaces the main repo's four-loops. |
| `apps/dashboards/<name>` | The markets and plant dashboards, as today |
| `packages/ui` | The design system: tokens, shell CSS, header and footer partials ([ADR 0003](0003-design-system.md)). Not published. |

### 4. Address: `isoloop.dev`

| Address | Serves |
| --- | --- |
| `isoloop.dev/` | The site |
| `isoloop.dev/examples/` | The examples hub |
| `isoloop.dev/examples/basic/` | basic |
| `isoloop.dev/examples/dashboards/<name>/` | Each dashboard, every build under it, as today |

- **The apex is the address.** `www.isoloop.dev` redirects to it.
- **Sections are paths, not subdomains.** One Pages site has one domain, so subdomains would need a repo each.
- **The domain is verified for the org,** so no other repo can claim it.
- **The main repo's `isoloop.github.io/isoloop/`** becomes a redirect to `https://isoloop.dev/` that keeps the path's query and hash.
- **Old `isoloop.github.io/examples/…` addresses are not kept.** The rename changes the Pages path, keeping them would need a repo named `examples` or `isoloop.github.io`, and nothing linking to them was announced. Our own links move to `isoloop.dev` in the same change.
- **Until the site lands,** `/` is a plain placeholder pointing at the examples and GitHub.

### 5. Deploys

- **Every deploy is one Pages build of every app,** at the tagged commit, as `deploy.yml` does today.
- **Triggers:**
  - an app tag: `markets-v*`, `plant-v*`, `basic-v*`, which first runs that app's full E2E
  - `site-v*`, for site content
  - a manual run
- **App tags mark measured versions.** A figure on the site names the tag it was measured at.
- **Only the maintainer pushes these tags.**
- **No trigger from the library repo.** A `v*` release in `isoloop/isoloop` can't start a workflow here without a token, so a release is followed by a `site-v*` tag that bumps the pins. M4 may decide to automate this.

### 6. Toolchain

`web` follows `isoloop/isoloop` [ADR 0009](https://github.com/isoloop/isoloop/blob/main/docs/adr/0009-toolchain.md), referenced rather than copied:
- pnpm 12 workspaces, Node 26
- TypeScript 7 `tsc` checks
- oxlint and oxfmt with the same settings
- Vite 8, Vitest 5, Playwright
- tools called only through root scripts, no git hooks
- exact pins in a `catalog:`, a 3-day `minimumReleaseAge`, blocked lifecycle scripts
- weekly grouped Dependabot, actions pinned by sha

The differences:

| ADR 0009 rule | Here |
| --- | --- |
| 2. `isolatedDeclarations` in published packages | Nothing here is published, so it's not used. `packages/ui` is private. |
| 3. Cross-package imports resolve to source | `@isoloop/*` comes from npm (`catalogs.isoloop`, one `next` prerelease for every app until 0.1). Workspace packages here (`packages/ui`) are imported by name. |
| 7. Browser baseline from the features the library uses | Vite's default target, Baseline widely available: Chrome and Edge 111, Firefox 114, Safari 16.4. Every app page carries the plain-HTML notice from `shared/browser-check.ts`. |
| 12. Four CI jobs; Pages from `main` | PRs run checks and E2E for the changed apps only; pushes to main run `check`; tags deploy; the weekly run does the full matrix and comparisons. Pages deploys only from tags or by hand. |

### 7. Where decisions live

- **`web/docs/adr/`, numbered from 0001,** holds the decisions about the site, the examples and the design system. The library's ADRs don't cover them.
- **`web/docs/plans/`** holds the plans. A plan may list tasks in the library repo, with the repo marked.
- **The library repo's plans README** has one row linking here.

## Consequences

**Good**

- The library repo holds only the library. Its CI, issues and history aren't about page styling.
- The site, the examples and the design system share one workspace. A new example, its hub card and the landing page's card can change in one PR, and the design system is imported, not copied.
- One address for everything, on a domain that doesn't depend on the host. Moving off GitHub Pages later wouldn't change any URL.
- The rename keeps everything the examples repo has built up: history, tags, PRs, environments, and redirects for repo links.
- Pins make what the site shows from the library reproducible: the same `site-v*` tag always builds the same pages.

**Bad**

- Outside links to `isoloop.github.io/examples/…` break. There should be few, since nothing was announced.
- `.dev` is HTTPS-only (HSTS preload), so `isoloop.dev` doesn't load at all until Pages has issued its certificate. That's a short gap, once, before anything links to it.
- Every deploy rebuilds every app. A site text fix also redeploys the dashboards, at the same commit. This is already how deploys work today.
- The site's build fetches the library repo at a pinned sha, and M4's docs build will fetch guides and TSDoc at a tag. That's a second repo in the build, and a pin someone has to bump.
- A library release doesn't update the site by itself. Someone pushes a `site-v*` tag after it.
- The name `examples` is retired for good in the org.

## Alternatives considered

- **The site as `site/` in the library repo:** no fetching of docs or diagrams, and drift tests run next to the code. But it puts the website and its design system in the library's repo and CI, the examples would need a copy of the design system, and the site would sit at `isoloop.github.io/isoloop/`. It was the first recommendation, and it was dropped once the site stopped importing `@isoloop/*` (basic is embedded instead) and the design system had to be shared with the examples.
- **Three repos (library, examples, a separate site repo):** keeps the site apart, but the design system then lives in one repo and is copied into the other, with a sync script, a lock file and a drift check. Two repos remove all of that.
- **Sharing the design system across repos:** each way was costed against the pinned copy, and none was better than one workspace.
  - Served live from the site at a versioned path: a site deploy could break the examples without a PR there.
  - An npm package: `isoloop/isoloop` ADR 0011 puts every `@isoloop/*` package in one release group, which a stylesheet doesn't belong in.
  - A git dependency: it skips the release-age and lockfile checks.
- **Naming the repo `isoloop.github.io`:** gives the github.io root without a domain, but ties the repo's name to one host. Rejected.
- **An empty `isoloop.github.io` repo as a deploy target:** the root on github.io with the sources elsewhere, but it needs a deploy key or token, CI pushing into another repo, and the name still exists. Rejected for the custom domain.
- **Starting at `isoloop.github.io/web/` and adding the domain later:** Pages would redirect the project path to the domain once it's set. But every link written in the meantime would point at an address that moves, and the domain already exists.
- **Subdomains** (`examples.isoloop.dev`, `docs.isoloop.dev`): one Pages site has one domain, so each would need its own repo.
- **Keeping the old `/examples/` paths alive with redirects:** needs a repo named `examples` (which breaks the rename's redirects) or `isoloop.github.io` (the name rejected above).
- **A new repo with the examples history imported, and `examples` archived:** old links would keep working against the archive, but tags, PRs, environments and the Pages settings would have to be redone. The rename keeps them.
