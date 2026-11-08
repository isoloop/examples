# The recorded comparison

The markets dashboard, native and on Isoloop, in React and in Preact. Recorded
by [this CI run](https://github.com/isoloop/examples/actions/runs/42464452395)
on a GitHub-hosted `ubuntu-latest` runner (4 cores, no GPU), Chromium, one page
at a time. Rerun it with the *Comparison* workflow
(`.github/workflows/comparison.yml`), or locally with
`pnpm --filter ./apps/markets compare`. The raw numbers are in the `*.json`
files and [`summary.md`](summary.md).

Two scenarios:

1. **Sizes** (M3c): each size, Lite, Normal and Heavy, on each build, at the
   replay's own rate, with no stress controls used.
2. **One chart blocked** (M3b): Lite at 10×, typing while one chart runs a 3 s
   busy loop and the trades table floods the bus.

## Sizes

Each build runs 6 s of warm-up, then a 10 s window with no input, then 5
keystrokes into the alerts panel.

| Size | Build | Main-thread CPU | Renderer CPU, all threads | Renderer memory (PSS) | Layouts/s | Style recalcs/s | Frames over 25 ms | Typing (median) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lite | Native · React | 5.1% | 7.5% | 123 MB | 9.5 | 60.1 | 0 of 600 | 6 ms |
| Lite | Isoloop · React | 2.7% | 10.0% | 192 MB | 10.9 | 60.0 | 0 of 600 | 27 ms |
| Lite | Native · Preact | 4.7% | 7.5% | 117 MB | 10.0 | 60.0 | 0 of 600 | 5 ms |
| Lite | Isoloop · Preact | 2.8% | 9.8% | 187 MB | 11.1 | 60.1 | 0 of 600 | 28 ms |
| Normal | Native · React | 42.2% | 50.1% | 202 MB | 56.1 | 62.6 | 0 of 600 | 11 ms |
| Normal | Isoloop · React | 17.5% | 73.6% | 524 MB | 56.3 | 60.7 | 0 of 600 | 37 ms |
| Normal | Native · Preact | 27.3% | 34.5% | 211 MB | 56.7 | 60.9 | 0 of 600 | 5 ms |
| Normal | Isoloop · Preact | 13.5% | 49.9% | 498 MB | 55.9 | 60.4 | 0 of 600 | 32 ms |
| Heavy | Native · React | 59.0% | 67.9% | 278 MB | 59.1 | 75.5 | 0 of 600 | 15 ms |
| Heavy | Isoloop · React | 20.5% | 99.6% | 754 MB | 58.4 | 60.7 | 0 of 600 | 32 ms |
| Heavy | Native · Preact | 43.8% | 54.0% | 252 MB | 58.7 | 65.7 | 0 of 600 | 16 ms |
| Heavy | Isoloop · Preact | 17.3% | 79.3% | 687 MB | 56.4 | 60.5 | 0 of 600 | 32 ms |

What each figure covers:

- **Main-thread CPU, layouts/s, style recalcs/s:** the page's main thread only
  (CDP `Performance.getMetrics`). Work in workers isn't in these.
- **Renderer CPU, all threads:** the main thread and every worker
  (`SystemInfo.getProcessInfo`), as % of one core.
- **Renderer memory:** PSS of the renderer processes, workers included.
- **Frames over 25 ms:** gaps between the ticker tape's animation frames.
- **Typing:** from keystroke to the alerts panel re-rendering.

What the numbers show, on this runner and in Chromium:

- **Neither build drops frames at any size.** M3c's starting hypothesis was that
  from Normal up the native page would drop frames and input would slow. That
  isn't borne out here: native's main thread is busy 42–59% at Normal and
  Heavy and still keeps every frame, and its typing stays at 5–16 ms.
- **Isoloop moves the work off the main thread** (17–21% against 42–59% at
  Normal and Heavy) but uses more in total: about 1.3–1.5× the CPU across all
  threads and 1.6–2.7× the memory.
- **Typing costs Isoloop about 20–30 ms more** at every size: the keystroke goes
  to the alerts panel's worker and the render comes back on the next frame.
- **Layouts and style recalcs per second are about the same** on both builds
  here. (A hand-run on a desktop in DevTools showed fewer on Isoloop; this
  controlled run doesn't reproduce that.)

Time per category, ms per second (the React pair; the same tables for every
size and pair are in `summary.md`):

| Category | Normal, native (main thread) | Normal, Isoloop (own threads) | Normal, Isoloop DOM apply (main thread) | Heavy, native (main thread) | Heavy, Isoloop (own threads) | Heavy, Isoloop DOM apply (main thread) |
| --- | --- | --- | --- | --- | --- | --- |
| raw · canvas | 10.3 | 15.3 | 0.0 | 11.0 | 13.7 | 0.0 |
| raw · dom | 3.5 | 4.1 | 1.1 | 6.4 | 13.2 | 6.0 |
| filtered · canvas | 19.7 | 16.8 | 0.0 | 34.5 | 29.4 | 0.0 |
| filtered · dom | 2.9 | 4.2 | 0.3 | 7.2 | 16.0 | 1.7 |
| aggregated · canvas | 0.6 | 1.2 | 0.0 | 28.0 | 26.4 | 0.0 |
| aggregated · dom | 0.0 | 0.1 | 0.1 | 0.0 | 0.2 | 0.1 |
| combined · canvas | 0.7 | 1.5 | 0.0 | 1.9 | 6.2 | 0.0 |
| combined · dom | 5.0 | 7.5 | 9.3 | 3.9 | 6.7 | 6.6 |
| engines | 0.8 | 1.5 | 0.0 | 1.1 | 2.7 | 0.0 |

Canvas work leaves the main thread entirely on Isoloop; DOM widgets still cost
main-thread time there, for applying their changes.

[`side-by-side-normal.webm`](side-by-side-normal.webm): the React pair at
Normal, native on the left and Isoloop on the right.

## WebKit

The recorded comparison runs in Chromium. Playwright's WebKit on Linux (no GPU)
behaves differently, and Isoloop's typing latency there is well above
Chromium's:

| WebKit | Isoloop · React | Native · React | Isoloop · Preact | Native · Preact |
| --- | --- | --- | --- | --- |
| Lite, CI runner | 87 ms | 27 ms | 71 ms | 20 ms |
| Normal, CI runner | 373–419 ms | 42–44 ms | 436–548 ms | 25 ms |
| Heavy, CI runner | no answer within 30 s | — | no answer within 30 s | — |
| Heavy, 32-core desktop, one page at a time | 166 ms | 8 ms | — | — |

CI runner figures are from the budget check in
[Weekly run 42464452395](https://github.com/isoloop/examples/actions/runs/42464452395);
the desktop figure is from a diagnostic run with 3 repeats.

**Why:** WebKit presents each frame a worker draws to a transferred
`OffscreenCanvas` on the page's main thread. A standalone page with no Isoloop
code reproduces it: WebKit drops to 10 frames/s at 160 canvas updates per
second and stops at 240, while Chromium stays at 60. In the diagnostic, taking
the canvas widgets off, or drawing them in their workers without presenting
them, brought Isoloop at Heavy from 166 ms to 32–33 ms; applying DOM changes
added about 3 ms. Native draws its canvases on the main thread directly and
isn't affected. The details, the repro page and what an ideal engine would do
are in
[engine constraints](https://github.com/isoloop/isoloop/blob/main/docs/investigations/engine-constraints.md).
Not yet checked in Safari on macOS or iOS, or on a GPU-backed WebKit.

The budget check (`e2e/budget.spec.ts`) marks the cases over budget on WebKit
as expected to fail: they still run and report, and turn red if WebKit gets
within budget.

## One chart blocked

Lite at 10×. Type into the alerts panel 5 times while it's calm. Then, with the
trades table flooding the bus (1,000 records/s), 5 more times, each 200 ms into
its own 3 s busy loop in the price chart.

| Build | Typing, calm (median) | Typing, one chart blocked (median) | (worst) | fps after | Long tasks (10 s) | First data | JS, gzipped |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Native · React | 13 ms | 2821 ms | 2836 ms | 3 | 3 | 110 ms | 108 KB |
| Isoloop · React | 33 ms | 38 ms | 60 ms | 61 | 0 | 331 ms | 168 KB |
| Native · Preact | 8 ms | 2822 ms | 2823 ms | 9 | 3 | 78 ms | 49 KB |
| Isoloop · Preact | 32 ms | 29 ms | 65 ms | 61 | 0 | 261 ms | 108 KB |

- **With one chart blocked**, typing on native waits the busy loop out (about
  2.8 s), and the page's frame rate drops. On Isoloop the chart's loop is its
  own, so the alerts panel answers in tens of milliseconds and the page stays
  at 60 fps.
- **What Isoloop costs:** about 20–25 ms more per keystroke when nothing is
  blocked, about three times the time to first data, and about 60 KB more
  JavaScript, gzipped.

[`side-by-side.webm`](side-by-side.webm): the React pair, native on the left
and Isoloop on the right.

## Why there's no throttled-CPU run

Chromium's CPU throttling (CDP `Emulation.setCPUThrottlingRate`, the same
setting as DevTools' "CPU: 4× slowdown") slows the page's main thread but not
its dedicated workers. Measured in Chromium 156 with a fixed loop: on the main
thread 18 ms unthrottled and 73 ms at 4×; in a worker 18 ms in both. Worker
targets don't accept the call (`'Emulation.setCPUThrottlingRate' wasn't
found`), so it can't be applied to them either. A throttled run would slow
native's widgets and not Isoloop's, so it isn't a like-for-like slower device,
and the comparison doesn't include one. The same applies to throttled runs in
DevTools by hand.
