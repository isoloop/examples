# Plant dashboard, matched head-to-head after the app's own timings fix (Q6)

The same runs as [`../matched/`](../matched/README.md), on the same machine and settings, after examples#59. With that change:

- **Timings:** each thread sends its widgets' and engines' timings as one `plant.timings` record a second, instead of one per widget and engine.
- **Health engine:** it reads its own topic only on start.

The native builds run the same batching code. On native it never leaves the page. In native + workers, each data worker now posts one timings message a second instead of three.

**What it took off the bus**, measured locally in Chromium for 5 s, counting the bus worker's outgoing messages (results and deliveries):

| Placement | Before | After |
| --- | --- | --- |
| `matched` | 1,208/s | 929/s (−23%) |
| `one` | 1,198/s | 888/s (−26%) |

`plant.timings` publishes went from 97/s to 10/s (`matched`) and to 1/s (`one`).

## How it was measured

- **Same as `matched/`:** the Ryzen 7 5825U server with other containers paused, every core fixed at 2.0 GHz, and the Playwright `v1.64.1-noble` image pinned to CPUs 2, 4, 6 and 8, with `@isoloop/*@0.0.0-next.61245db`.
- **Runs:** each pair interleaved, 5 rounds for [`responsiveness/`](responsiveness/summary.md) (Chromium and Firefox, 1 and 5 kHz), 3 rounds with a 10-minute hold for [`memory/`](memory/summary.md) (Chromium, 1 kHz).
- **Judged against spread:** "Before" is the Isoloop build's median in `matched/`, and "after" is the median here. A change counts only where it falls outside both runs' round-to-round spread; those are given as ranges in each summary.

## Isoloop's figures, before and after

Chromium, from `responsiveness/` unless the row says `memory/`.

### native against Isoloop `one`

| Figure | `one` before | `one` after | Gap to native, after | Change beyond spread? |
| --- | --- | --- | --- | --- |
| CPU, all threads, 1 kHz | 91% | 88% | +11 pp | no |
| CPU, all threads, 5 kHz | 113% | 111% | +16 pp | no |
| CPU, all threads, `memory/` 1 kHz | 90% | 89% | +7 pp | no |
| Main-thread CPU, 5 kHz | 24% | 23% | −59 pp | no |
| Memory at 16 s, after GC | 194 MB | 188 MB | +36 MB | no |
| Memory at 10 min, after GC (`memory/`) | 214 MB | 220 MB | +39 MB | no |
| Typing, 5 kHz | 21 ms | 22 ms | −52 ms | no |
| First data | 459 ms | 457 ms | +159 ms | no |
| Recovery after a 3 s block | 3443 ms | 3478 ms | +307 ms | no |
| Late frames, Firefox 5 kHz | 0 | 0 | −123 | no |

### native + workers against Isoloop `matched`

| Figure | `matched` before | `matched` after | Gap to native + workers, after | Change beyond spread? |
| --- | --- | --- | --- | --- |
| CPU, all threads, 1 kHz | 98% | 102% | +13 pp | no |
| CPU, all threads, 5 kHz | 121% | 119% | +22 pp | no |
| CPU, all threads, `memory/` 1 kHz | 102% | 94% | +12 pp | no (spreads overlap) |
| Main-thread CPU, 5 kHz | 27% | 27% | −51 pp | no |
| Memory at 16 s, after GC | 244 MB | 239 MB | +47 MB | no |
| Memory at 10 min, after GC (`memory/`) | 268 MB | 271 MB | +21 MB | no |
| Memory at 10 min, as read (`memory/`) | 602 MB | 595 MB | +202 MB | no |
| Typing, 5 kHz | 33 ms | 24 ms | −41 ms | no |
| First data | 526 ms | 559 ms | +242 ms | no |
| Late frames, Firefox 5 kHz | 1 | 1 | −86 | no |

## What the figures show

- **About a quarter fewer bus messages moved no CPU or memory figure beyond the spread,** in either pair, at either rate. Isoloop's total CPU stayed at 88–119%, and its gaps to native stayed at +7 to +22 percentage points, as before. Memory after GC moved by at most 6 MB either way.
- **Per-message overhead isn't where the CPU and memory gap comes from** in this app, at these message rates (about 1,200 → 900 outgoing per second). The message-reduction changes planned next (combined commits, results only on failure, batching) would remove further messages of the same kind. On this evidence, their effect on CPU and memory should be measured before it is assumed.
- **The comparison is fairer:** Isoloop no longer sends one bus record a second per widget and engine for the demo's own measuring.
- **The `one` placement still recovers more slowly after the 10-minute hold** (5.5 s, with a 5.9 s data gap) than early in a run (3.5 s). This is the same as before Q6, and still not looked into.
