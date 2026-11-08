# The recorded comparison

The markets dashboard, native and on Isoloop, under the same scripted scenario
(M3b task 18). Recorded by [this CI run](https://github.com/isoloop/examples/actions/runs/42381294079) on a GitHub-hosted
`ubuntu-latest` runner (4 cores), Chromium, one test at a time. Rerun it with
the *Comparison* workflow (`.github/workflows/comparison.yml`), or locally
with `pnpm --filter ./apps/markets compare`.

**The scenario:** the replay source at 10×, so trades, book updates and
aggregates keep flowing. Type into the alerts panel 5 times while it's calm.
Then, with the trades table flooding the bus (1,000 records/s), 5 more times,
each 200 ms into its own 3 s busy loop in the price chart. Latency is from
typing to the panel re-rendering, which is what a user waits for.

| Build | Typing, calm (median) | Typing, one chart blocked (median) | (worst) | fps after | Long tasks (10 s) | First data | JS, gzipped |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Native · React | 11 ms | 2832 ms | 2844 ms | 27 | 3 | 168 ms | 100 KB |
| Isoloop · React | 34 ms | 42 ms | 58 ms | 61 | 0 | 357 ms | 153 KB |
| Native · Preact | 13 ms | 2832 ms | 2847 ms | 4 | 3 | 103 ms | 41 KB |
| Isoloop · Preact | 35 ms | 40 ms | 86 ms | 61 | 0 | 277 ms | 94 KB |

- **With one chart blocked**, typing on native waits the busy loop out (about 2.8 s),
  and the page's frame rate drops. On Isoloop the chart's loop is its own, so the
  alerts panel answers in tens of milliseconds and the page stays at 60 fps.
- **What Isoloop costs:** about 25 ms more per keystroke when nothing is blocked
  (the input goes to the isolate and the render comes back), about twice the time to
  first data, and about 50 KB more JavaScript, gzipped.
- **React and Preact** show the same pattern; Preact's native build is the smallest.

[`side-by-side.webm`](side-by-side.webm): the React pair, native on the left and
Isoloop on the right. The per-build numbers are in the `*.json` files.

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
