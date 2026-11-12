# Plant dashboard, CPU baseline after the sampler fix

The per-thread CPU probe ([isoloop#165](https://github.com/isoloop/isoloop/pull/165), `docs/investigations/plant-cpu.md`) run again after [#61](https://github.com/isoloop/examples/pull/61). That PR stopped the Isoloop build's metrics from building a snapshot of every isolate on each animation frame, and samples apply times once a second instead. This is the baseline for ADR 0016's changes.

## How it was measured

Everything is as in the original probe, so the two can be compared directly:
- **Setup:** the server described in [`../matched/README.md`](../matched/README.md), four physical cores fixed at 2.0 GHz, with `@isoloop/*@0.0.0-next.61245db`.
- **Probe and runs:** the same probe scripts, run unchanged at examples `8f22ce0`. Unminified builds, Chromium, 15 s of warm-up and then 10 s windows, with 4 interleaved rounds per configuration.
- **Data:** each thread's CPU is read from `/proc` in a window with no tracing. Trace events and V8 samples only divide that time into buckets.
- **Files:** [`results/`](results/) holds each run's summary (`*-run*.json`), `buckets.json` and `buckets.md`. [`minified/`](minified/) and [`unminified/`](unminified/) hold the untraced check that minifying doesn't change the figures. The raw traces, about 670 MB, are still on the server.

## What the fix changed

Isoloop's main thread, renderer CPU in ms/s, median of 4 runs with the range in brackets:

| Configuration | Before | After | Change |
| --- | --- | --- | --- |
| `matched`, 5 kHz | 279 [267–307] | 264 [262–265] | −14 |
| `matched`, 1 kHz | 276 [267–286] | 261 [252–264] | −15 |
| `one`, 5 kHz | 246 [243–249] | 244 [238–250] | −2 |
| `one`, 1 kHz | 258 [241–261] | 246 [240–246] | −12 |

By bucket, on the main thread:
- **The demo's metrics panels:** down by 9 to 14 ms/s in three of the four configurations. In `one` at 1 kHz the drop is only 4 ms/s.
- **"Host: other"** (kernel snapshots and worker message dispatch): up by 0 to 6 ms/s.
- **Net effect:** 2–15 ms/s less on the main thread. That's less than the "up to about 20 ms/s" the profile estimated. The 2 Hz panel read still takes a snapshot, and some of the snapshot cost sits in "host: other" either way.

## The renderer gap now

Isoloop's renderer CPU minus native's, in ms/s. Each run is paired with the native run in the same round. Median, with the range in brackets:

| Pair | Before | After |
| --- | --- | --- |
| native + workers → `matched`, 5 kHz | +171 [158–197] | +225 [136–312] |
| native → `one`, 5 kHz | +181 [80–228] | +129 [80–203] |
| native + workers → `matched`, 1 kHz | +122 [91–144] | +86 [6–184] |
| native → `one`, 1 kHz | +158 [43–207] | +91 [15–162] |

**The gap ranges overlap before and after in every pair, so whole-renderer gaps don't separate a change this size from noise.** Native's own renderer varies by up to 120 ms/s between rounds. The per-thread figures above are the ones to use for small changes.

**`matched` at 5 kHz is split into two groups.** Two of the four runs show the widgets' pool worker at 743 and 748 ms/s, and the other two at 600 and 582, which is where all four were before. The difference is canvas raster and present inside that worker: 508–532 against 385–387 ms/s. The app's own drawing code takes the same time in all four (58–64 ms/s), and the main thread doesn't change. This fix only touched main-thread code, so the split doesn't come from it. It looks like Skia's raster work in the worker varying between runs, which hasn't been investigated. Until it is, figures from `matched` at 5 kHz need more rounds, or should be compared on the bus and messaging buckets, which don't change between the two groups (about 31–32 ms/s of messaging in the pool worker in every run).

Full bucket tables are in [`results/buckets.md`](results/buckets.md). The before figures are in isoloop#165, `docs/investigations/assets/plant-cpu/results/`.
