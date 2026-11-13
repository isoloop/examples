# Plant architecture diagrams

What runs on which thread in each build of the plant dashboard, and how records move between widgets, data jobs and the bus. They're published at `/dashboards/plant/architecture/` (`scripts/assemble-site.sh`), and the plant's header links to the diagram of the build being viewed.

| File | Build | Threads |
| --- | --- | --- |
| `native` | everything on the main thread | 1 |
| `native-workers` | data jobs on 9 workers, widgets on the main thread | 1 + 9 |
| `one` | Isoloop, every isolate in one pool | 1 + 1 + bus |
| `matched` | Isoloop default: 8 data pools, a fleet worker, 1 visual pool | 1 + 10 + bus |
| `split` | Isoloop: a visual pool per machine | 1 + 18 + bus |
| `own` | Isoloop: every isolate on its own worker | 1 + 105 + bus |

Each diagram is an [Archify](https://github.com/tt-a1i/archify) architecture candidate (`<name>.json`) and its rendered page (`<name>.html`). Both are committed, so building and deploying the site doesn't need Archify. All six share one layout and the same element ids, and machine T3 stands for each of the eight machines.

## Keeping them true

`src/isoloop/architecture.test.ts` reads each JSON and checks its thread and isolate counts:

- the Isoloop placements against `workersOf` in `src/isoloop/placement.ts`
- the native builds against the workers `src/native/workers.ts` starts

A placement change that isn't redrawn fails the plant's unit tests.

The `sources` in each JSON cite the plant's code at a fixed commit (`meta.repository.revision`). When the code they point at changes, update the lines and the revision.

## Re-rendering

Archify isn't part of this repo's toolchain. To re-render after editing a JSON:

1. Install the Archify skill or CLI.
2. From the repo root, for each changed diagram, run:

   ```bash
   node <archify>/bin/archify.mjs finalize architecture \
     apps/dashboards/plant/architecture/<name>.json \
     apps/dashboards/plant/architecture/<name>.html \
     --repo-root . --quality showcase
   ```

   If no Chrome is found, set `ARCHIFY_CHROME` to a Chromium executable, for example Playwright's.
3. Run `node apps/dashboards/plant/architecture/externalize.mjs`. This moves the page's inline scripts into the shared `viewer-<hash>.js` files, so the pages run under `script-src 'self'`, the Isoloop hosting guide's policy. Delete any `viewer-*.js` that no page references any more.
4. Delete the `*.delivery.json` receipts Archify writes next to each page. They aren't committed.
