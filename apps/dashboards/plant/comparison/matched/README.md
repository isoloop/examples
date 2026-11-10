# Plant dashboard, matched head-to-head

What Isoloop costs and what it contains when it runs the same work with about the same number of threads as each native build:

- **native** (everything on the main thread) against **Isoloop `one`**: one pool for every feed, engine and widget.
- **native + workers** (one data worker per machine, one fleet worker, widgets on the main thread) against **Isoloop `matched`**: one data pool per machine, the fleet engine on its own worker, and one visual pool for all 72 widgets.

Isoloop can't render on the main thread, so each Isoloop build has one more thread than its native counterpart, plus the bus worker: 0 against 1 + bus, and 9 against 10 + bus. `split`, the default placement (18 + bus), was measured alongside for reference.

## How it was measured

- **Machine:** a home server doing nothing else. AMD Ryzen 7 5825U (8 cores, 16 threads), 30 GB, Ubuntu 24.04.3, kernel 6.8.0-147, Docker 28.5.1. The other containers were paused, the governor was set to `performance`, and every core was fixed at 2.0 GHz, so there was no boost and no thermal drift.
- **Container:** Playwright's official image `v1.64.1-noble` with Node 26.13.0 and pnpm 12.16.1 ([`../Dockerfile`](../Dockerfile)), pinned with `--cpuset-cpus=2,4,6,8` to four physical cores, one thread each.
- **Libraries:** `@isoloop/*@0.0.0-next.61245db`, which has the bus retention fix (isoloop#163).
- **Runs:** each pair ran interleaved (A, B, A, B…), one page at a time, with [`../run.ts`](../run.ts). The gap is B − A within each round; the tables give its median and the spread across rounds.
  - **[`responsiveness/`](responsiveness/summary.md):** 5 rounds, Chromium and Firefox, 1 and 5 kHz, readings at about 16 s.
  - **[`memory/`](memory/summary.md):** 3 rounds, Chromium, 1 kHz, with a 10-minute hold.
- **Memory:** renderer PSS from `/proc`, as before, read as is and again after forcing garbage collection in every page and worker. Firefox gives no memory figures.
- **Typing:** each figure is the median of 5 keystrokes per run. Its spread across rounds is wide (the ranges in the summaries), so differences of 10–15 ms are within noise.

The absolute figures depend on the fixed 2.0 GHz clock. An earlier, unfixed local run on a desktop CPU ([`../desktop-4core/`](../desktop-4core/summary.md)) had more headroom, and there native kept 60 fps at every rate.

## native against Isoloop `one`

Chromium, 1 kHz unless a column says otherwise; medians of the rounds.

| | native | Isoloop `one` | Gap |
| --- | --- | --- | --- |
| Threads | main | main + 1 + bus | +1 + bus |
| Late frames, Chromium 1 / 5 kHz | 0 / 0 | 0 / 0 | none |
| Late frames, Firefox 1 / 5 kHz | 11 / 130 | 0 / 0 | −11 / −130 |
| Typing, Chromium 1 / 5 kHz | 35 / 89 ms | 20 / 21 ms | −14 / −69 ms |
| Typing, Firefox 1 / 5 kHz | 115 / 124 ms | 84 / 100 ms | −39 / −11 ms |
| Main-thread CPU | 69% | 24% | −45 pp |
| CPU, all threads | 79% | 91% | +10 pp (+19 pp at 5 kHz) |
| Memory at 16 s, after GC | 153 MB | 194 MB | +39 MB (+25%) |
| Memory at 10 min, after GC | 179 MB | 214 MB | +35 MB (+20%) |
| Memory at 10 min, as read | 270 MB | 339 MB | +70 MB (+26%) |
| First data | 284 ms | 459 ms | +226 ms |
| All 72 widgets with data | 1360 ms | 2375 ms | +1027 ms |
| A widget blocked for 3 s: what stalls | the whole page | everything (one pool) | same |
| Recovery after the block | 3160 ms | 3443 ms | +293 ms |
| Data gap, every machine | 3.8 s | 3.3 s | −0.5 s |

## native + workers against Isoloop `matched`

| | native + workers | Isoloop `matched` | Gap |
| --- | --- | --- | --- |
| Threads | main + 9 | main + 10 + bus | +1 + bus |
| Late frames, Chromium 1 / 5 kHz | 0 / 0 | 0 / 0 | none |
| Late frames, Firefox 1 / 5 kHz | 16 / 76 | 1 / 1 | −15 / −75 |
| Typing, Chromium 1 / 5 kHz | 46 / 74 ms | 45 / 33 ms | −4 / −40 ms |
| Typing, Firefox 1 / 5 kHz | 111 / 133 ms | 87 / 83 ms | −29 / −50 ms |
| Main-thread CPU | 75% | 27% | −48 pp |
| CPU, all threads | 90% | 98% | +8 pp (+19 pp at 5 kHz) |
| Memory at 16 s, after GC | 195 MB | 244 MB | +47 MB (+24%) |
| Memory at 10 min, after GC | 246 MB | 268 MB | +25 MB (+10%) |
| Memory at 10 min, as read | 387 MB | 602 MB | +220 MB (+57%) |
| First data | 370 ms | 526 ms | +205 ms |
| All 72 widgets with data | 2259 ms | 1727 ms | −527 ms |
| A widget blocked for 3 s: what stalls | the whole page | the widgets' pool; data keeps flowing | – |
| Recovery after the block | 3145 ms | 2855 ms | −290 ms |
| Data gap, every machine | 0 s | 0 s | none |

## What the figures show

- **Isoloop takes most of the work off the main thread.** Its main thread runs at 24–29% in every Isoloop placement, against 69–83% for both native builds. In native + workers the widgets still render on the main thread, so its main thread is as busy as native's.
- **Under the heavier loads, that gives the main thread room.** At 5 kHz in Chromium, native's typing is at 89 ms and native + workers' at 74 ms, against 21 and 33 ms. In Firefox both native builds drop frames (130 and 76 late of ~600 at 5 kHz), and both Isoloop builds drop at most one. At 1 kHz in Chromium the builds are within noise of each other.
- **The price:**
  - **CPU:** 8–19 percentage points more in total, across threads.
  - **Memory:** 25–47 MB more after GC. Read as is, which includes garbage not yet collected, it's 70–220 MB more.
  - **Start-up:** 200–350 ms later to first data in Chromium, and 290–535 ms in Firefox.
  - **Filling the page:** in `one`, about a second longer until all 72 widgets have data; `matched` gets there sooner than native + workers.
- **Memory no longer grows faster than native's.** From 16 s to 10 min after GC, `matched` grows 28 MB and native + workers 55 MB; `one` grows 21 MB and native 29 MB. The bus retention fix is in these runs. Before it, the bus worker alone grew by about 52 MB in 10 minutes ([plant memory investigation](https://github.com/isoloop/isoloop/pull/162)).
- **Uncollected garbage is the largest remaining gap.** At 10 minutes, `matched` read 602 MB as is and 268 MB after GC, and `split` 875 MB and 328 MB. Most of the as-read gap is allocation that hasn't been collected yet. The memory investigation traces it to each record being copied once per subscribing isolate.
- **Containment depends on placement, and `one` has none.** A block in `one` stalls every machine's data, as it does in native, and the pool restarts as a whole. `matched` keeps the data flowing (0 s gap) and restarts only the widgets' pool.
- **One reading to check:** after the 10-minute hold, `one` recovered from the block in 5.5 s with a 5.6 s data gap. That's against 3.4 s and 3.3 s at 16 s, and the other placements didn't change. It may be the catch-up from 10 minutes of retained topics into a pool of 90 isolates; it hasn't been looked into yet.

## Remaining gaps, largest first

1. **Garbage from copying each record once per subscriber.** This is 70–220 MB as read and drives most of the extra total CPU. The fix is to deliver once per pool worker, or to batch, which ties into ADR 0005's one-port-per-isolate rule.
2. **Start-up:** 200–500 ms more to first data. Not broken down yet.
3. **The framework, runtime and document in each visual pool.** About 4–5 MB per pool after GC: small in `matched` and `one`, more in `split` (9 visual pools).
4. **The bus worker and the fleet engine's worker.** About 8 MB together, and the bus worker is part of the design (ADR 0005).
