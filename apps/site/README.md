# Site

isoloop.dev's own pages ([ADR 0002](../../docs/adr/0002-site-build.md)): the landing page, how it works and the examples hub. The examples themselves are built on their own and put next to these pages by [`scripts/assemble-site.sh`](../../scripts/assemble-site.sh).

- **Pages are Preact components**, rendered to static HTML at build time through `ui/render` ([ADR 0003](../../docs/adr/0003-design-system.md)). No framework code reaches the browser; the only script on a page is ui's theme script.
- **Every page carries** `<meta http-equiv="Content-Security-Policy" content="default-src 'self'">`, and every request is same-origin. The meta is left out in dev, where Vite injects inline styles.

| Path | What it is |
| --- | --- |
| `index.html`, `how-it-works/index.html`, `examples/index.html`, `404.html` | One-line stubs (`<!-- page:home -->`) that `build/plugin.ts` turns into whole documents |
| `src/pages/` | The pages, by name (`src/pages/index.ts`) |
| `src/copy.ts` | **Every text on the site,** with the source of each figure in a comment above it (ADR 0002, decision 10) |
| `build/plugin.ts` | Renders the stubs, copies the hub's screenshots and the diagrams into the build |
| `build/examples.ts` | Reads and validates every app's `example.json` (a zod schema); a bad one fails the build, naming the file and the field |
| `build/diagrams.ts` | Rewrites the library's Archify pages to run under the site's policy |
| `build/library.ts` | Fetches the library's `docs/diagrams` at the sha in `library.lock` |
| `scripts/` | `serve.ts` (static server, as Pages), `linkcheck.ts`, `screenshots.ts`, `fetch-library.ts` |
| `e2e/` | The smoke test, and `expectAccessible` (axe) |

## Running it

```bash
pnpm --filter site dev            # the site's own pages, with the diagrams
pnpm --filter site build          # dist/
```

The whole site as deployed, with the examples:

```bash
pnpm --filter "./apps/dashboards/*" --filter ./apps/basic --filter ./apps/site build
pnpm --filter ui build:specimens
SITE=1 scripts/assemble-site.sh site     # from the repo root; SITE=1 includes the site's pages
pnpm --filter site linkcheck ../../site
pnpm --filter site serve                 # http://localhost:4799/
pnpm --filter site smoke                 # Chromium smoke test against site/
```

Without `SITE=1`, `assemble-site.sh` includes the site only once a `site-v*` tag is reachable from `HEAD`, so the deployed root stays the placeholder until the first site tag.

## The library's diagrams

`library.lock` pins an `isoloop/isoloop` commit. The build clones that repo without blobs into `.library/` (git-ignored), checks the pin is on its `main` (so the diagrams passed the drift test there), and takes only `docs/diagrams`. A fetched pin is reused, offline too. To show newer diagrams, change the sha in `library.lock` in a PR.

Archify's pages need three rewrites to run under `default-src 'self'` (`build/diagrams.ts`):
- **Style attributes** (`style="--step:N"`, one `fill`) become classes, with the declarations in a generated `dg-inline-<hash>.css`.
- **`data:` URLs** in the viewer's CSS (fonts, icons) become files next to the pages.
- **The viewer's `<style>` element** for its flow keyframes becomes a constructable stylesheet.

Anything else inline fails the build, so a re-render that brings something new is caught here.

## The hub

Each app has an `example.json` next to its `package.json`: `title`, `summary`, `order`, an optional `result` (`line` and the `tag` it was measured at), `links` (`live`, `source`, and optionally `results` and `architecture`) and an optional `screenshot`. The schema is in `build/examples.ts`; unknown fields fail, so a typo can't slip through.

Screenshots: after building and assembling the site (above), `pnpm --filter site screenshots` writes each app's `screenshot.webp` (960×600) at a fixed state. Run it when an app's look changes, check the images, and commit them. It isn't in CI: the dashboards' live data makes every run's images differ.

## Accessibility

The target is WCAG 2.2 AA (ADR 0002, decision 9). The smoke test runs axe on every page and on ui's specimens, failing on serious and critical findings; the contrast of the tokens is a unit test in `packages/ui`. The rest is checked by hand **before each `site-v*` tag**:

- [ ] Tab through each page from the top: every link and button is reached in reading order, and the focus ring is visible on each, in both themes.
- [ ] The theme toggle works by keyboard (Enter and Space) and says its state (pressed means dark).
- [ ] Inside the basic iframe, Tab reaches every Block, Crash and Restart button, and leaves the frame again.
- [ ] With a screen reader (VoiceOver or NVDA), each page's headings read as an outline, each table reads its caption and both headers, and each iframe has a name.
- [ ] At 200% zoom and at 320 px wide, nothing is cut off and only the tables scroll sideways.
- [ ] With reduced motion set, nothing animates on the site's own pages.
- [ ] Windows high-contrast mode (forced colours): borders and focus rings stay visible.
