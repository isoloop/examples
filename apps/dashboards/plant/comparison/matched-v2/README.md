# Plant dashboard, matched head-to-head, second server run

This is the same comparison as [`../matched/`](../matched/README.md): native against Isoloop `one`, and native + workers against Isoloop `matched`, with `split` measured alongside. This run has every fix since that first one, and adds a per-thread CPU probe.

## What changed between the runs

Each item gives the PR, what it changed, and the run it first appears in:
- **The bus retention fix (isoloop#163):** expired records are released at once, not when their chunk fills. It was already in `matched/`.
- **The timings fix (examples#59, Q6):** timings are published once a second per thread, and the health engine reads its own topic only on start. First in [`../matched-q6/`](../matched-q6/README.md).
- **The metrics sampler fix (examples#61):** Isoloop's apply-time sampler runs once a second, not every frame. First in [`../cpu-baseline/`](../cpu-baseline/README.md).
- **Combined commits (isoloop#166, ADR 0016 decision 1):** one `commits` message per port per 100 ms. It's new in this run, with `@isoloop/*@0.0.0-next.d028bc1` (examples#63).
- **Synchronous handlers (isoloop#169):** they run through a delivery without yielding per record. Also new in this run.

## How it was measured

- **Machine and runner:** the same server, container, pinning and runner as [`../matched/`](../matched/README.md#how-it-was-measured). That's four physical cores fixed at 2.0 GHz, pairs interleaved one page at a time, with the gap taken as B − A within each round.
- **Responsiveness:** 5 rounds, Chromium and Firefox, 1 and 5 kHz.
- **Memory:** 3 rounds with a 10-minute hold, Chromium at 1 kHz.
- **CPU probe:** the probe from `docs/investigations/assets/plant-cpu/` in isoloop (PR #165), unminified builds, Chromium, 15 s of warm-up and then 10 s windows. It ran 4 interleaved rounds per configuration, and 6 for the `matched` pair at 5 kHz. Each thread's CPU comes from `/proc` in a window without tracing. The trace events and V8 samples only split that time into buckets. Only the summaries are kept in [`cpu/results/`](cpu/results/); the raw traces stay on the server.
- **How changes are judged:** a change since `matched/` counts as beyond the noise only when the two runs' gap spreads don't overlap. Typing spreads are wide in both runs (often ±40 ms or more), so typing changes are within the noise unless the note says otherwise.

## native against Isoloop `one`

Gap (B − A), median of rounds, with the change since `matched/` in brackets:

| Figure | Chromium 1 kHz | Chromium 5 kHz | Firefox 5 kHz |
| --- | --- | --- | --- |
| Late frames | 0 (0) | 0 (0) | −122 (−130 before) |
| Typing | +8 ms (−14 before) | −45 ms (−69 before) | −25 ms (−11 before) |
| Main-thread CPU | −45 pp (same) | −59 pp (same) | – |
| CPU, all threads | +9 pp (+10 before) | +17 pp (+19 before) | – |
| Memory at 16 s, after GC | +30 MB (+39 before) | +38 MB (+41 before) | – |
| First data | +264 ms (+226 before) | +276 ms (+247 before) | +469 ms (+286 before) |
| All 72 widgets with data | +1089 ms (+1027 before) | +1214 ms (+1191 before) | +1385 ms |
| Recovery after a 3 s block | +285 ms (+293 before) | +232 ms (+265 before) | +366 ms (+265 before) |

None of these changes is beyond the noise. Memory after GC at 1 kHz comes closest: its spread went from +34 to +43 MB before, to +27 to +34 MB now, so the two only touch.

## native + workers against Isoloop `matched`

| Figure | Chromium 1 kHz | Chromium 5 kHz | Firefox 5 kHz |
| --- | --- | --- | --- |
| Late frames | 0 (0) | 0 (0) | −83 (−75 before) |
| Typing | −5 ms (−4 before) | −28 ms (−40 before) | −31 ms (−50 before) |
| Main-thread CPU | −44 pp (−48 before) | −54 pp (same) | – |
| CPU, all threads | +10 pp (+8 before) | +18 pp (+19 before) | – |
| Memory at 16 s, after GC | +47 MB (same) | +60 MB (+67 before) | – |
| First data | +229 ms (+205 before) | +255 ms (+330 before) | +527 ms (+456 before) |
| All 72 widgets with data | +105 ms (−527 before) | −687 ms (+133 before) | +404 ms |
| Recovery after a 3 s block | −299 ms (−290 before) | −334 ms (−314 before) | +325 ms (+244 before) |

None of these changes is beyond the noise either. "All 72 widgets with data" swings by more than a second between rounds in both runs.

## After a 10-minute hold

Chromium, 1 kHz, 3 rounds. Change since `matched/` in brackets:

| Figure | native → `one` | native + workers → `matched` |
| --- | --- | --- |
| Memory at hold, after GC | 185 → 215 MB, +30 MB (+35 before) | 252 → 271 MB, +19 MB (+25 before) |
| Memory at hold, as read | 281 → 340 MB, +59 MB (+70 before) | 396 → 551 MB, **+155 MB (+220 before)** |
| CPU, all threads | +11 pp (+12 before) | +10 pp (+18 before) |
| Recovery after a 3 s block | +2263 ms (5.5 s, as before) | −280 ms |

- **One change is beyond the noise:** `matched`'s memory as read at 10 minutes. Its gap spread went from +205 to +225 MB before, to +147 to +158 MB now. That's about 65 MB less uncollected garbage, which fits combined commits and the timings fix sending fewer messages.
- **The other changes are within the round spreads.** `matched`'s CPU across threads dropped from +18 to +10 points, but its earlier spread (+9 to +19) overlaps the new one (+9 to +11).
- **`one` still recovers slowly after the hold:** 5.5 s, with a 5.6 s data gap. The cause is the catch-up replay on its single thread, investigated in isoloop PR #172.

## Per-thread CPU probe

Renderer CPU in ms/s, Isoloop minus native, median of rounds. Before is [`../cpu-baseline/`](../cpu-baseline/README.md), measured with the metrics sampler fix but before combined commits:

| Pair | Renderer gap, before → after | Messaging, before → after |
| --- | --- | --- |
| native + workers → `matched`, 5 kHz | +294 → +168 | +143 → +128 (−15) |
| native → `one`, 5 kHz | +95 → +148 | +127 → +117 (−10) |
| native + workers → `matched`, 1 kHz | +87 → +133 | +103 → +102 (−1) |
| native → `one`, 1 kHz | +92 → +90 | +93 → +88 (−5) |

**Messaging** is the sum of four buckets: the browser serialising, deserialising and passing messages between threads (IPC), `postMessage` serialisation, the bus client, and the broker. In `matched` at 5 kHz:

| Messaging bucket | Before → after, ms/s |
| --- | --- |
| Serialise, deserialise and IPC | +78.6 → +73.6 |
| `postMessage` serialisation | +23.7 → +18.8 |
| Bus client | +23.8 → +21.7 |
| Broker | +16.5 → +13.7 |

Schema validation stays at 1–2 ms/s.

- **The messaging gap is 10–15 ms/s smaller at 5 kHz.** That's in line with what combined commits measured on its own (8–14 ms/s) before it merged. At 1 kHz it's 1–5 ms/s smaller, within the noise: there are fewer records per port there, so fewer commits to combine.
- **The renderer gaps move far more than that, in both directions,** so they can't show a change this size. Native's own renderer varies by up to ~120 ms/s between rounds, and so does the Isoloop widgets' raster (next point).
- **The raster split is weaker this time.** In `cpu-baseline/`, `matched` at 5 kHz split into two groups: the widgets' pool worker spent 508–532 ms/s on canvas raster and present in two runs, and 385–387 in the other two. In this run's 6 rounds it spent 463, 428, 393, 392, 389 and 370 ms/s, so one run is high and the rest are close together. That's why `matched`'s median gap fell from +294 to +168 ms/s; the cause is still unknown.

## What it shows

- **The position is unchanged since `matched/`.**
  - Isoloop keeps its main thread at 23–28% against 70–82% for both native builds.
  - At 5 kHz, it types faster than both native builds in Chromium (22–25 against 51–68 ms) and drops no frames in Firefox (0–2 late, against 85–122).
  - It costs +9 to +18 points of CPU across threads, +19 to +60 MB after GC, and 230–530 ms more to first data.
- **The fixes since `matched/` are real, but small at this scale.**
  - Messaging work is 10–15 ms/s lower at 5 kHz, and about the same at 1 kHz.
  - `matched`'s uncollected garbage at 10 minutes is about 65 MB lower.
  - No other figure has moved beyond the round spread.
