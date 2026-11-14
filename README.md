# Isoloop web

The [Isoloop](https://github.com/isoloop/isoloop) website, its examples and its design system, served at **[isoloop.dev](https://isoloop.dev/)**. Everything here is built on the published `@isoloop/*` packages, installed from npm the way any app would; the library itself, its guides and its ADRs live in [`isoloop/isoloop`](https://github.com/isoloop/isoloop).

- **Decisions** about this repo are in [`docs/adr`](docs/adr): what the repo is (0001), how the site is built (0002), the design system (0003).
- **Plans** are in [`docs/plans`](docs/plans), starting with the [website plan](docs/plans/site.md).
- **Apps** are packages under `apps/`, grouped by kind (`apps/dashboards/<name>`). The live examples are at [isoloop.dev/examples](https://isoloop.dev/examples/).

Until the site lands, [isoloop.dev](https://isoloop.dev/) shows a placeholder that links to the examples.

| App | What it shows |
| --- | --- |
| [`apps/basic`](apps/basic) | The smallest example: four vanilla isolates on three event loops, A and B on their own workers, C and D sharing a pool. Block or crash any of them; a pool is a unit of failure. It's embedded on the landing page. [Live](https://isoloop.dev/examples/basic/) |
| [`apps/dashboards/markets`](apps/dashboards/markets) | A backend-less markets dashboard: public exchange feeds, cross-market aggregates and alerts, all in the visitor's tab. One code base, five builds (native and Isoloop, each with React and with Preact, plus a mixed React and Preact Isoloop build), in Lite, Normal and Heavy sizes, with live metrics. [Live](https://isoloop.dev/examples/dashboards/markets/) |
| [`apps/dashboards/plant`](apps/dashboards/plant) | A telemetry dashboard for a fictional plant of eight machines: 72 widgets on seeded high-rate sensor data. Three builds (native, native with a data worker per machine, Isoloop), and placements of the Isoloop build's isolates in workers and pools. [Live](https://isoloop.dev/examples/dashboards/plant/) |

## Browser support

Safari 16.4 or later, or a recent Chrome, Edge or Firefox. That's Vite's default build target ("Baseline Widely Available": Chrome and Edge 111, Firefox 114, Safari 16.4), and what the Isoloop builds need: module workers, `OffscreenCanvas` drawn in workers, and adopted stylesheets on a shadow root. The native builds also call ES2023 array methods (`toSorted`, from Safari 16).

On anything older, each page says so instead of staying blank. Every app page carries a plain-HTML notice and a small classic script, `browser-check.js`, both from [`shared/browser-check.ts`](shared/browser-check.ts):
- the notice shows even when no script runs
- the script names what's missing and stops the app from starting (`shared/guard.ts`)
- the app removes the notice once it has loaded

The script is a file, not inline, so it runs under the hosting guide's `script-src 'self'` policy.

## Setup

Node 26 (`.nvmrc`) and pnpm 12 (`packageManager`), as in the main repository.

```bash
pnpm install
pnpm check            # format, lint, typecheck, unit tests
pnpm e2e              # Playwright, all three engines
pnpm --filter markets dev
```

Until Isoloop 0.1, the apps use `next` prereleases of `@isoloop/*`: one version for every package, set in `pnpm-workspace.yaml` (`catalogs.isoloop`). To move to a newer one, change it there and run `pnpm install`.

## License

MIT
