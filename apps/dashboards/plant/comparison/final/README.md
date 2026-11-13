# Plant dashboard, final server run

The figures that ship with `plant-v0.1.0`: the same comparison as [`../matched-v2/`](../matched-v2/README.md), on the libraries the release uses (`@isoloop/*@0.0.0-next.b8ffdcf`, examples#66). Native runs against Isoloop `one`, and native + workers against Isoloop `matched`, with `split` measured alongside.

## What changed since `matched-v2/`

- **Protected built-ins in pools** ([isoloop#173](https://github.com/isoloop/isoloop/pull/173), the [ADR 0001 amendment](https://github.com/isoloop/isoloop/blob/main/docs/adr/0001-one-worker-per-isolate.md), #174). A pool's frozen built-ins leave the properties V8 protects as plain data, so array iteration, destructuring and regexps keep their fast paths in pooled code.
- **2-minute retention for slow signals** (examples#64). It shortens a restarted `one` pool's replay. That's measured in [plant-one-pool](https://github.com/isoloop/isoloop/blob/main/docs/investigations/plant-one-pool.md), not here: this run has no 10-minute hold.
- **The default placement is now `matched`** (examples#69). The runner names its placements explicitly, so the change doesn't affect these figures.

## How it was measured

- **Setup:** the same server, container, pinning and runner as [`../matched/`](../matched/README.md#how-it-was-measured), on 2026-11-13. That's four physical cores fixed at 2.0 GHz, pairs interleaved one page at a time, and the gap taken as B − A within each round.
- **Responsiveness:** 5 rounds, Chromium and Firefox, 1 and 5 kHz ([`responsiveness/summary.md`](responsiveness/summary.md)).
- **CPU probe:** the same probe as `matched-v2/`, with 4 interleaved rounds per configuration and 6 for the `matched` pair at 5 kHz ([`cpu/results/buckets.md`](cpu/results/buckets.md)). Only the summaries are kept; the raw traces stay on the server.
- **Memory:** no 10-minute hold this time. The memory-over-time figures stay those of [`../matched-v2/`](../matched-v2/README.md#after-a-10-minute-hold), because the built-ins change affects CPU, not what's held in memory. The 16 s readings are below.
- **How changes are judged:** a change since `matched-v2/` counts as beyond the noise only when the two runs' gap spreads don't overlap.

## native against Isoloop `one`

Gap (B − A), median of rounds, with `matched-v2/` in brackets:

| Figure | Chromium 1 kHz | Chromium 5 kHz | Firefox 5 kHz |
| --- | --- | --- | --- |
| Late frames | 0 (0) | 0 (0) | −126 (−122) |
| Typing | −12 ms (+8) | −55 ms (−45) | −26 ms (−25) |
| Main-thread CPU | −45 pp (−45) | −60 pp (−59) | – |
| CPU, all threads | +7 pp (+9) | +11 pp (+17) | – |
| Memory at 16 s, after GC | +36 MB (+30) | +40 MB (+38) | – |
| First data | +305 ms (+264) | +187 ms (+276) | +434 ms (+469) |
| All 72 widgets with data | +1030 ms (+1089) | +1195 ms (+1214) | +1426 ms (+1385) |
| Recovery after a 3 s block | +216 ms (+285) | +316 ms (+232) | +379 ms (+366) |
| Data gap, every machine | −0.5 s (−0.5) | −0.4 s (−0.4) | −0.3 s (−0.3) |

None of these changes is beyond the noise. CPU across threads at 5 kHz comes closest: +8 to +14 pp now, against +12 to +22 pp before.

## native + workers against Isoloop `matched`

| Figure | Chromium 1 kHz | Chromium 5 kHz | Firefox 5 kHz |
| --- | --- | --- | --- |
| Late frames | 0 (0) | 0 (0) | −89 (−83) |
| Typing | −8 ms (−5) | −28 ms (−28) | −8 ms (−31) |
| Main-thread CPU | −44 pp (−44) | −53 pp (−54) | – |
| CPU, all threads | +11 pp (+10) | +19 pp (+18) | – |
| Memory at 16 s, after GC | +41 MB (+47) | +51 MB (+60) | – |
| First data | +307 ms (+229) | +294 ms (+255) | +498 ms (+527) |
| All 72 widgets with data | −568 ms (+105) | −719 ms (−687) | +376 ms (+404) |
| Recovery after a 3 s block | −218 ms (−299) | −246 ms (−334) | +144 ms (+325) |
| Data gap, every machine | 0 s (0) | 0 s (0) | 0 s (0) |

None of these changes is beyond the noise either.

## Measured alongside: `split`

`split` was the default placement until examples#69. Chromium, 1 and 5 kHz:
- **Workers and frames:** 18 workers + bus, and 0 late frames.
- **Typing:** 26 and 31 ms.
- **CPU across threads:** 108% and 131%.
- **Memory at 16 s after GC:** 286 and 326 MB.
- **First data:** 831 and 912 ms.
- **Recovery after a block:** 2.7 and 3.4 s, with no data lost.

Against `matched`, measured in the same rounds, that's 51–54 MB more memory after GC and 13–15 points more CPU across threads, for typing within noise and the same frames.

## CPU probe

Renderer CPU, Isoloop minus native, ms/s, with `matched-v2/` in brackets:

| Pair | Renderer gap | App's own feeds and engines, Isoloop | Messaging (serialize, deserialize, IPC) gap |
| --- | --- | --- | --- |
| `matched`, 5 kHz (6 rounds) | +149 (+168) | 36.3 (59.0) | +70.6 (+73.6) |
| `one`, 5 kHz | +99 (+148) | 50.9 (95.3) | +75.9 (+79.2) |
| `matched`, 1 kHz | +65 (+133) | 12.8 (20.3) | +59.5 (+63.0) |
| `one`, 1 kHz | +98 (+90) | 14.6 (30.3) | +61.8 (+61.3) |

- **The app's own code in pools got faster.** In `one` at 5 kHz the feeds and engines take 50.9 ms/s, against 95.3 before, and native's main thread takes 61.6. At 1 kHz the figures are 14.6 against 30.3 before, with native at 21.2. This is the built-ins change: before it, array iteration in a pool left V8's fast path ([plant-one-pool](https://github.com/isoloop/isoloop/blob/main/docs/investigations/plant-one-pool.md)).
- **The renderer gap fell in three of four pairs:** by 19–68 ms/s. The `one` pair at 1 kHz is within its noise.
- **Messaging is unchanged,** and it is now the largest share of what remains: 59–76 ms/s, plus Isoloop's own messaging code. [ADR 0016](https://github.com/isoloop/isoloop/blob/main/docs/adr/0016-fewer-messages-per-record.md) explains why the rest is the cost of the bus hop.
- **Canvas raster in `matched` at 5 kHz** read 389–408 ms/s in rounds 1–4. The two extra rounds read 457–473 ms/s; they ran as a second probe call right after the first. That's the same kind of split as in [`../cpu-baseline/`](../cpu-baseline/README.md), and its cause is still unknown. It moves the renderer total, not the messaging or app buckets.
