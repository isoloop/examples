# Plant dashboard

A telemetry dashboard for a fictional plant: 8 machines, 72 widgets, and sensor data heavy enough to matter. Vibration is sampled at 1, 2 or 5 kHz, with spectra, percentiles, correlations and persistent alarms. It's built three ways from the same widgets and the same seeded data: **native** (everything on the main thread), **native + workers** (a data worker per machine, the way a careful team would write it, with the widgets on the main thread) and **Isoloop**. The Isoloop build places its isolates several ways, chosen with `?placement=`.

Live at **https://isoloop.dev/examples/dashboards/plant/** (`?rate=1|2|5`; `?placement=matched|split|one|machine|shared-engines|own` on the Isoloop build).

Isoloop isn't a way to make a native page faster: it adds threads, a message bus and a kernel, and that costs CPU and memory. What it gives for that cost is the whole package: containment, restart and catch-up, a broker with retention, replay and durable history, and placement chosen with a switch. This page puts what each build does first and what it costs second, both as measured.

## What each build does when something goes wrong

The block button keeps a widget's loop busy for 3 s; the kernel stops a loop busy for 2 s, so an Isoloop pool restarts. Recovery is the time from the click until every affected widget updates again. Figures are Chromium at 1 kHz on the desktop machine (`comparison/final/`).

| | native | native + workers | Isoloop `one` | Isoloop `matched` (default) | Isoloop `split` |
| --- | --- | --- | --- | --- | --- |
| Threads | main thread only | main + 9 workers | main + 1 + bus | main + 10 + bus | main + 18 + bus |
| A widget blocks for 3 s: what stalls | the whole page | the whole page | every widget, feed and engine | all 72 widgets | that machine's 8 widgets |
| Data lost during the block | 3.8 s on every machine | none | 3.3 s on every machine | none | none |
| Recovery | 3.2 s | 3.1 s | 3.4 s | 2.9 s | 2.7 s |
| After the block | the page carries on; nothing restarts | the page carries on; nothing restarts | the pool restarts; its members catch up from the retained topics | the widgets' pool restarts and catches up | that pool restarts and catches up |
| A widget throws while rendering | its error boundary shows "crashed"; it stays down until a reload | the same; a data worker that errors is started again after 250 ms, with an empty store | the isolate crashes and the kernel restarts it | the same | the same |
| Alarms and events across a reload | `localStorage`, written at most once a second, capped at 10,000 each | the same (the page's store) | persistent topics in OPFS: every acknowledged record survives a reload, capped at 10,000 each, oldest dropped | the same | the same |

Sources:
- **Blocks, restarts and catch-up:** `e2e/placements.spec.ts`. For each placement, a blocked widget takes down exactly its pool, which catches up from the retained topics, and other machines keep going. In `one`, the restarted trend and stats read their history back. On both native builds, a block stalls the whole page.
- **Data lost and recovery:** the comparison's fault columns (`comparison/final/responsiveness/summary.md`).
- **Persistence:** `e2e/placements.spec.ts` checks that alarms and events keep every acknowledged record across a reload, up to 10,000, and that a second tab falls back to memory and says so. The native builds' storage is in `src/core/store.ts`.
- **Throws:** `src/slot/native.tsx` (the native builds' per-widget error boundary) and `src/widgets/stress/withStress.tsx`. The plant's E2E suite covers blocks, not throws. A pool member's own error restarting it alone is covered in the libraries' tests (isoloop, M2c task 4).

Isoloop also reports each isolate's state, pool and worker in `kernel.isolates()`, which the page's headers and metrics read. It also enforces the worker budget: `own` exceeds the soft budget of 32 and the page warns about it.

## Responsiveness, on three devices

Each device has a different role, so each is shown with what it can and can't show.

### Mid-range phone: where native runs short

MediaTek MT8781V, 8 cores, 8 GB, 96 Hz screen, Firefox 156. Two rounds per page, given as a range; 96 frames/s is the ceiling ([`comparison/phone/ikko-mindone-focus156/`](comparison/phone/ikko-mindone-focus156/README.md)).

| Build | Frames/s, 1 and 5 kHz | Late frames | Typing median | Slowest keystroke | First data |
| --- | --- | --- | --- | --- | --- |
| native | 45–56 | 32–56 | 32–64 ms | 369–549 ms | 0.4–0.9 s |
| Isoloop `one` | 80–84 | 1–3 | 15–18 ms | 109–149 ms | 1.2–1.8 s |
| native + workers | 47–54 | 29–50 | 33–57 ms | 437–575 ms | 0.7–0.9 s |
| Isoloop `matched` | 68–77 | 4–23 | 19–23 ms | 140–312 ms | 1.4–2.0 s |
| Isoloop `split` | 31–48 | 92–156 | 43–199 ms | 784–2502 ms | 1.8–2.3 s |

Both native builds draw well below the screen's rate and keep keystrokes waiting for hundreds of milliseconds. Native + workers doesn't help, because its 72 widgets still render on the main thread. `one` and `matched` keep the main thread free. `split`, with 18 workers on 8 cores, is the slowest build here, which is why `matched` is the default.

### Desktop machine: the main thread under load, and the cost

AMD Ryzen 7 5825U, 4 physical cores fixed at 2.0 GHz. Medians of 5 interleaved rounds ([`comparison/final/`](comparison/final/README.md)).

| | native | Isoloop `one` | native + workers | Isoloop `matched` |
| --- | --- | --- | --- | --- |
| Main-thread CPU, Chromium 5 kHz | 84% | 23% | 79% | 27% |
| Typing median, Chromium 5 kHz | 82 ms | 21 ms | 62 ms | 41 ms |
| Late frames, Firefox 5 kHz (of ~600) | 126 | 0 | 89 | 1 |
| Typing median, Firefox 5 kHz | 128 ms | 100 ms | 115 ms | 105 ms |
| Late frames, Chromium 1 and 5 kHz | 0 | 0 | 0 | 0 |

At 1 kHz in Chromium every build keeps up. The difference shows under the heavier load. On this fixed clock the machine has less headroom than a typical desktop; on a faster one, the main-thread differences shrink.

### Flagship phone: headroom, no difference

Snapdragon 8 Gen 3 for Galaxy, Chrome 157, one recording per page ([`comparison/phone/galaxy-fold6-chrome157/`](comparison/phone/galaxy-fold6-chrome157/README.md)). Every build, `own` included, held 60 frames/s with no long tasks at 1 and 5 kHz, and typing stayed at 9–13 ms median. Here the builds don't differ in responsiveness, and the cost below is all that's left.

## What it costs

Isoloop minus its matched native build, desktop machine, Chromium. The 16 s figures come from [`comparison/final/`](comparison/final/README.md), the 10-minute figures from [`comparison/matched-v2/`](comparison/matched-v2/README.md#after-a-10-minute-hold).

| | `one` − native | `matched` − native + workers |
| --- | --- | --- |
| Threads | +1 worker + bus | +1 worker + bus |
| Time to first data | +0.2–0.3 s | +0.3 s |
| All 72 widgets with data | +1.0–1.2 s | −0.6–0.7 s (faster) |
| CPU across all threads, 1 and 5 kHz | +7 and +11 points | +11 and +19 points |
| Memory after GC, at 16 s | +36–40 MB (+23–24%) | +41–51 MB (+21–23%) |
| Memory after GC, after 10 minutes | +30 MB | +19 MB |
| Memory as read, after 10 minutes (includes garbage not yet collected) | +59 MB | +155 MB |

- **On the mid-range phone,** Isoloop takes 1.2–2.0 s to first data, against 0.4–0.9 s for the native builds.
- **Most of the extra CPU** is moving records between threads: the bus hop, at a fixed cost per message in the browser. The [CPU investigation](https://github.com/isoloop/isoloop/blob/main/docs/investigations/plant-cpu.md) and [ADR 0016](https://github.com/isoloop/isoloop/blob/main/docs/adr/0016-fewer-messages-per-record.md) explain it.
- **The app's own code costs no more in a pool** than on native's main thread. At 5 kHz its feeds and engines take 51 ms/s in `one`, against 62 ms/s on native's main thread ([`comparison/final/`](comparison/final/README.md#cpu-probe)).
- **In Playwright's WebKit on Linux,** the Isoloop page freezes in `split` and varies in `matched` ([engine constraint 2](https://github.com/isoloop/isoloop/blob/main/docs/investigations/engine-constraints.md)). Safari on an iPad didn't; see [Devices](#devices).

## Devices

- **Mid-range phone:** iKKO MindOne. MediaTek MT8781V: 2 × Cortex-A76 at 2.2 GHz and 6 × Cortex-A55 at 2.0 GHz, per [MediaTek's MT8781 page](https://www.mediatek.com/iot/modem-based-iot/mt8781). 8 GB, a 96 Hz screen, Android 15, Firefox Focus 156. It was driven over adb, with results read from the page's Record 10 s panel ([`comparison/phone/ikko-mindone-focus156/`](comparison/phone/ikko-mindone-focus156/README.md)).
  - **Chrome on this phone is untested.** Chrome 157 failed to start its renderer processes during an earlier automated attempt. The cause was our tooling (`am force-stop` before each run), not the page, and Chrome wasn't retried after the phone restarted ([details](comparison/phone/ikko-mindone-focus156/README.md)).
- **Desktop machine:** a home server doing nothing else. AMD Ryzen 7 5825U, with the run pinned to 4 physical cores and every core fixed at 2.0 GHz. Ubuntu 24.04, in Playwright's Docker image `v1.64.1-noble`. Pairs were run interleaved, 5 rounds ([`comparison/final/`](comparison/final/README.md); memory from [`comparison/matched-v2/`](comparison/matched-v2/README.md)).
- **Flagship phone:** Samsung Galaxy Z Fold6, inner screen. Snapdragon 8 Gen 3 for Galaxy and 12 GB, per [Samsung's specs](https://www.samsung.com/ph/smartphones/galaxy-z-fold6/specs/); the browser reports 8 cores and 8 GB. Chrome 157, recorded by hand once per page ([`comparison/phone/galaxy-fold6-chrome157/`](comparison/phone/galaxy-fold6-chrome157/README.md)).
- **iPad, observed, not recorded:** an iPad with Apple M2, in Safari, at `plant-v0.1.0-rc.3`. The user opened `isoloop/?rate=5&placement=split` and `isoloop/?rate=5&placement=matched`. Both pages filled, kept updating and didn't crash, and the page's fps badge showed a steady 60 on both. That was one look at each page: there's no Record 10 s result and no typing figure. Playwright's headless WebKit on Linux freezes these pages ([engine constraint 2](https://github.com/isoloop/isoloop/blob/main/docs/investigations/engine-constraints.md)); Safari on this iPad runs them at 60 fps, which matches the canvas repro ([isoloop#161](https://github.com/isoloop/isoloop/pull/161)).

## More

- **Placements:** when to pool and when not to, with the plant's figures for each placement, in the [pools guide](https://github.com/isoloop/isoloop/blob/main/docs/guide/pools.md). `split` keeps each machine's widgets in their own pool; choose it when per-machine widget containment matters more than its 8 extra workers.
- **Investigations:**
  - [where the memory goes](https://github.com/isoloop/isoloop/blob/main/docs/investigations/plant-memory.md)
  - [where the CPU goes](https://github.com/isoloop/isoloop/blob/main/docs/investigations/plant-cpu.md)
  - [the `one` placement's slow code and recovery](https://github.com/isoloop/isoloop/blob/main/docs/investigations/plant-one-pool.md)
- **Decisions:**
  - [ADR 0016](https://github.com/isoloop/isoloop/blob/main/docs/adr/0016-fewer-messages-per-record.md): fewer bus messages per record.
  - [ADR 0001's amendment](https://github.com/isoloop/isoloop/blob/main/docs/adr/0001-one-worker-per-isolate.md): a pool's frozen built-ins leave V8's protected properties as plain data.
- **The plan:** [M3d](https://github.com/isoloop/isoloop/blob/main/docs/plans/m3d-plant-dashboard.md).
- **Every recorded run:** [`comparison/`](comparison/README.md), with the method and how to run it again.
