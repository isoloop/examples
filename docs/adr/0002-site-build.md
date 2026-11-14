# ADR 0002: How the site is built

- **Status:** Accepted
- **Date:** 2026-11-14
- **Answers:** what `apps/site` is built with, which pages it has, what may run on them, how it shows the examples and the library's diagrams, and what its copy may claim. Where it lives and how it deploys is [ADR 0001](0001-what-this-repo-is.md); its look is [ADR 0003](0003-design-system.md).

## Context

The site is Isoloop's front door, for a developer evaluating Isoloop. For now it has three parts: a landing page, a "how it works" page and the examples hub. The docs (getting started, adapters, the bus guide, "What Isoloop can't hide", the API reference) come in M4.

The forces:

- **The pages are content.** Text, two tables, diagrams, cards and links. Only one part runs code that matters: the live `basic` example.
- **Practise what the hosting guide asks.** The guide recommends `script-src 'self'`, with no inline scripts. Pre-boot checks are same-origin files (examples #70).
- **GitHub Pages sends no headers.** A `<meta>` CSP covers only the page that carries it. A worker takes its policy from its own response headers, so on Pages the workers run without one.
- **The cost belongs on the page.** Isoloop costs CPU, memory and start-up time for what it gives. A front page that runs a heavy dashboard for every visitor, phones included, would contradict its own table. Basic runs three workers plus the bus. The plant at `matched` runs 10 plus the bus.
- **The positioning is fixed.** Isoloop is a complete toolchain (containment, restart and catch-up, a bus with retention, replay and durable history, placement as a switch, with the libraries teams already use). It is not pitched as faster than native, and the cost is stated plainly.
- **Own the stack.** Every dependency is one we could replace, behind an interface we own.
- **The docs engine isn't chosen yet.** M4 will pick it. Whatever it is, it has to render into this site's shell.

## Decision

### 1. Vite, plain HTML and CSS

- **A Vite 8 multi-page app** in `apps/site`. Each page is an `index.html` with its own CSS.
- **No UI framework and no CSS framework.** Header, footer and shell come from `packages/ui` (ADR 0003).
- **No templating library.** The build-time work is our own code, run as Vite plugins inside this repo:
  - including the header and footer partials (ADR 0003)
  - building the hub from `example.json` files (decision 5)
  - copying the library's diagrams (decision 6)

  Together they should come to about 100–200 lines, each with unit tests. When the M4 docs engine arrives, the partials plugin may become part of it.
- **The `base` path is set in config,** so moving the site is a one-line change.

### 2. Pages

| Path | Page |
| --- | --- |
| `/` | Landing (decision 3) |
| `/how-it-works/` | The core diagrams with short text (decision 6) |
| `/examples/` | The hub (decision 5) |
| `/404.html` | Not found, with links to the three |

Until the first `site-v*` tag, `/` is a plain placeholder pointing at the examples and GitHub (ADR 0001).

### 3. The landing page

In this order:
1. **Hero:** one line on what Isoloop is, three points (containment and restart; a bus with retention and replay; placement as a switch, with React, Preact or vanilla). The main action is "Open the plant dashboard live". Secondary links: how it works, GitHub.
2. **Live demo:** basic, embedded (decision 4).
3. **What it gives:** the behaviour table, condensed (block, crash, restart, persistence; native against Isoloop).
4. **What it costs:** the device table, copied and labelled (decision 7).
5. **Limits:** a short "What Isoloop can't hide" list (sync layout, `window` and `document` globals, drag and drop). M4 expands it into a page.
6. **How it works:** the runtime topology diagram, linking the full page.
7. **Examples:** cards for basic, plant and markets, linking the hub.
8. **Install:** `@isoloop/*@next`, labelled "before 0.1, the API may change".
9. **Footer:** GitHub, the ADRs, the licence.

### 4. What runs live, and what doesn't

- **Only basic runs on the site.** It's an `<iframe loading="lazy">` of `/examples/basic/?embed=1`, from the same build and origin, below the hero. Browsers it doesn't support get basic's own plain-HTML notice.
  - `?embed=1` hides basic's header bar (ADR 0003) and outer margins, so the landing page doesn't show a header inside a header.
  - Basic's theme follows the site's live, without a reload (decision 8). Its isolates' styles use the token custom properties, which inherit into their shadow-DOM surfaces.
  - Basic's own E2E covers embed mode and a live theme switch.
- **Plant and markets are cards** with a screenshot and an "Open live" link to the full page. They're never embedded. They're desktop-sized dashboards, and running them for every visitor would contradict the cost table.
- **The site imports no `@isoloop/*` package.** The live demo is basic itself, not a copy written for the site.

### 5. The examples hub

- **Each app holds an `example.json`:** title, one line, result line with the tag it was measured at, links (live, source, results, architecture where there is one), and a screenshot path.
- **The site validates them at build time** with a `zod` schema in `apps/site` (`zod` is already in the catalog), and writes `/examples/` from them. A bad or missing file fails the build, with an error that names the file and the field.
- **A new example joins the hub** by adding its `example.json`, in the same PR as the app.
- **Screenshots come from `pnpm screenshots`:** a Playwright script that opens each app at a fixed state (for example the plant at 10 s, `matched`) and writes a WebP next to its `example.json`. It's run by hand when an app changes, and the images are committed. It's not in CI, because the dashboards' live data makes images differ from run to run.

### 6. The library's diagrams

- **Where they come from:** the seven core diagrams live in `isoloop/isoloop` under `docs/diagrams/`, with their drift test against the code (ADR 0001, decision 1). The site's build fetches that folder at the sha pinned in `apps/site/library.lock`:
  - in CI, a sparse checkout of `isoloop/isoloop` at that sha
  - locally, `pnpm --filter site fetch-library`
- **Bumping the pin** is a site PR.
- **The pin must be on the library's `main`.** CI fails if the sha isn't reachable from `isoloop/isoloop`'s `main`, so only diagrams that passed the drift test there reach the site, never a commit from an open or abandoned PR.
- **On the page:** `/how-it-works/` gives each diagram a short text and its rendered Archify page in an `<iframe loading="lazy">`, with a link to open it full size.
  - The diagrams follow the site's theme live (decision 8). The Archify viewer styles from `<html data-theme>` but reads its theme only on load, so the diagrams plugin adds the theme script from `packages/ui` to each copied page. The script also keeps the viewer's own `archify-theme` key in step.
  - The order: runtime topology → placement → bus publish → isolate lifecycle → restart (own worker) → restart (pool) → bus crash and reattach.
  - The page shows the sha the diagrams were drawn from.
- **The viewers' scripts are external files,** as for the plant's architecture pages, so they run under the CSP.

### 7. Measurements

- **Figures are copied, labelled and linked.** The landing page's device table is copied from the plant's comparison results and labelled "measured at `plant-v0.1.0`, November 2026". It links to the full results.
- **The results behind a tag don't change,** so a labelled copy can't silently go stale. Newer measurements mean a new tag and a new label.
- **Every row stays,** including the older iPhone, where native does as well as Isoloop or better.

### 8. What may run, and what may be loaded

- **Every page carries `<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`.** That means no inline scripts, no inline styles and no `data:` URLs. Vite's `build.assetsInlineLimit` is `0`, so no asset is inlined.
- **Every request is same-origin.** No CDNs, web fonts, analytics, embeds from other sites, or tracking pixels.
- **JS only enhances the pages.** It comes as module files: the theme toggle, copy buttons on code, the diagram viewers. Every page reads correctly without JS, except the live demo, whose notice says so.
- **The theme is kept in `localStorage`, not cookies.** One small classic script from `packages/ui` (ADR 0003) sits in every page's `<head>`, on the site, the hub, basic and the copied diagrams:
  - Before first paint it sets `<html data-theme>` from `localStorage['isoloop-theme']`, falling back to the system setting.
  - It listens for `storage` events and system theme changes. The site's toggle writes the key once, and the page and every same-origin iframe switch in place, with no reload.
  - Every read and write is guarded, since storage can throw in blocked or sandboxed contexts. It then uses the system theme.
  - `?theme=light|dark` overrides the stored value, for the screenshot script and tests.
  - Nothing else is stored, and nothing is sent anywhere.
- **The Pages gap is stated plainly.** Because GitHub Pages can't send headers, basic's workers run without a policy there. The "how it works" page says so and links the hosting guide for real deployments, where the policy goes in headers.

### 9. Link previews and accessibility

- **Every page has** a `<title>`, a description, and Open Graph and Twitter card tags, with one static 1200×630 image per section (landing, how it works, examples), made from the chosen design and committed.
- **Accessibility: WCAG 2.2 AA.**
  - Semantic HTML: landmarks, headings in order, tables with headers.
  - Everything reachable by keyboard; `prefers-reduced-motion` respected.
  - **Checked automatically** by axe (`@axe-core/playwright`) in the smoke test, behind one helper of ours, `expectAccessible(page)`. It fails on serious and critical findings. Axe is a dev-only dependency, and the helper is the only place that knows about it.
  - **Colour contrast** of the tokens is checked by our own script (ADR 0003).
  - **The rest by hand:** keyboard order and screen-reader labels, from a short checklist in the site's README, run before a `site-v*` tag.

### 10. Copy rules

- **The positioning above.** Never "faster than native". The cost is stated plainly next to what Isoloop gives.
- **Performance is worded as measurements,** with the device, the build and the tag.
- **The maintainer reviews the copy** before a `site-v*` tag.

### 11. CI

One `site` job on PRs and pushes to main, when `apps/site`, `packages/ui`, `apps/basic` (the landing page embeds it) or any `example.json` changes:
- **The build,** including the `example.json` validation and the check that `library.lock` is on the library's `main`.
- **An internal link check:** our own script over the built site; external links aren't checked.
- **A Chromium smoke test** against the assembled site (every app, as deployed; the whole build takes about 20 s):
  - every page loads with no console errors, and a CSP violation counts as one
  - `expectAccessible` passes on every page
  - the basic iframe boots
  - crashing one of its isolates restarts it

### 12. The M4 docs

- **Docs render into this site's shell** (`packages/ui`) through an interface we own, with one dependency at most behind it and a conformance suite, so the dependency can be swapped.
- **The interface's shape is left to M4.** It will need more than source → HTML: front matter, a table of contents, code highlighting, API pages.
- **The engine is chosen by M4's ADR here,** together with how the guides and TSDoc are fetched from `isoloop/isoloop` at the release tag.

## Consequences

**Good**

- No framework or template engine to learn, update or replace. The only build tool is Vite, which the repo already uses, plus our own short plugins.
- The site follows the hosting guide's policy itself, and the smoke test fails on any violation.
- The live demo is the real basic example, so there's one demo to keep working, and its E2E covers it.
- Nothing on the site loads from another origin, so there's nothing to track the visitor and nothing that breaks when a third party changes.
- A new example appears on the hub from its own PR, with no edit to the site.
- The figures say exactly what they are: which device, which build, which tag.

**Bad**

- Our own plugins for partials, the hub and the diagrams are code we maintain, where a static-site framework would ship them.
- No syntax highlighting until the M4 docs engine. Code on these pages is plain `<pre>`.
- The live demo only shows what basic does. The plant's scale is a click away, not on the page.
- The diagrams come from another repo at a pinned sha, so a redrawn diagram reaches the site only when someone bumps the pin.
- Screenshots go stale unless someone runs `pnpm screenshots`.
- The meta CSP can't cover workers on Pages. The page says so, but the example isn't fully under the policy it recommends.
- Axe is a dependency in the smoke test, kept behind `expectAccessible`.

## Alternatives considered

- **VitePress, Starlight or Astro:** good static-site and docs engines, but each brings a framework (Vue, Astro's compiler) and its own theme, for pages that are mostly HTML. The docs engine is M4's choice, behind decision 12's interface.
- **Preact or React islands:** the site has nothing stateful outside basic, which runs in its own iframe.
- **Hand-written HTML with no build:** simplest, but no `base` handling, no partials, no hashed assets, and no hub built from `example.json`.
- **A template library (Nunjucks, Handlebars, Eta):** a dependency for two includes and one generated page.
- **Validating `example.json` by hand, or with a JSON Schema validator:** a hand-written check means writing our own error messages. A JSON Schema validator is a new dependency, though editors would autocomplete the file. `zod` is already in the catalog and can export a JSON Schema if that's wanted later.
- **Static SVG or PNG exports of the diagrams, inline:** lighter, but a second file per diagram to render, commit and keep current, in both themes. **Links only:** cheapest, but the page would show no diagrams.
- **The theme in a cookie:** cookies are for a server, and Pages ignores them. Each one goes with every request, and the Cookie Store API's change events aren't in Safari 16.4 or Firefox 114, so frames couldn't follow a change. **The theme as `?theme=` on each iframe:** it works, but every switch reloads the iframes, and basic restarts its isolates.
- **No automated accessibility check:** hand checks only. Axe catches the mechanical failures (missing labels, contrast, landmarks) on every PR, for one dev dependency.
- **Fixing the docs interface now (`renderMarkdown(source): html`):** M4 needs more than that, so the signature would be rewritten then.
- **A live demo written for the site:** the first plan. It duplicated basic and made the site depend on `@isoloop/*`. Embedding basic removed both.
- **Embedding plant and markets live,** on the landing page or behind a click on the hub: cramped in a section, and a heavy load for every visitor. Cards with "Open live" instead.
- **Fetching measurements from the dashboards' result files at build time:** one source of truth, but for four rows whose source can't change after its tag.
- **Analytics** (Plausible, GoatCounter, GA): a third-party script against `default-src 'self'`. GitHub's repo traffic and npm downloads cover what we'd learn before 0.1. Revisit at the launch.
- **Screenshots taken in CI:** live data makes every run's images differ, so they'd change in every PR.
