# Isoloop examples

Apps built on [Isoloop](https://github.com/isoloop/isoloop), installed from npm the way any app would. Each app is its own package under `apps/`, grouped by kind (`apps/dashboards/<name>`). The live demos are at [isoloop.github.io/examples](https://isoloop.github.io/examples/).

| App | What it shows |
| --- | --- |
| [`apps/dashboards/markets`](apps/dashboards/markets) | A backend-less markets dashboard: public exchange feeds, cross-market aggregates and alerts, all in the visitor's tab. One code base, five builds (native and Isoloop, each with React and with Preact, plus a mixed React and Preact Isoloop build), in Lite, Normal and Heavy sizes, with live metrics. [Live](https://isoloop.github.io/examples/dashboards/markets/) |

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
