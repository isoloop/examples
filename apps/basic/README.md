# Basic

The smallest Isoloop example (website plan task 4b), and the live demo on the landing page. Live at **https://isoloop.dev/examples/basic/**.

Four vanilla isolates, each with its own surface, on three event loops:

| Isolate | Runs in | Does |
| --- | --- | --- |
| A · Counter | its own worker | publishes `count.v1`; restarted, it reads its count back from the bus |
| B · Ticker | its own worker | a timer 20 times a second |
| C · Primes | pool `shared` | counts primes below 10 million and publishes `primes.v1` |
| D · Messages | pool `shared` | a log built only from the bus, read from the start; sends `note.v1` |

Every isolate has two buttons:

- **Block 3 s** keeps its loop busy. The kernel kills a loop that stays busy for 2 s (`heartbeat.killAfterMs`) and restarts it. Blocking C stops D as well, since they share a worker, and both restart together: a pool is a unit of failure.
- **Crash** calls `ctx.reportError()`, so the error is the isolate's own. Only that isolate restarts, even in the pool. An error thrown from a timer or an event handler would count as the worker's, and restart the whole pool.

"Block the main thread" freezes every surface on screen while the loops behind them keep running.

The topics are memory topics: the bus worker keeps them while the page is open, so a restarted isolate reads them again, and a reload starts empty. Two of them exist only for the site's demo (below): `activity.v1` and `control.v1`.

## Embedding

`?embed=1` hides the site's header and footer and the page title (`ui`'s `theme.js` sets `<html data-embed>`). The theme follows the visitor's choice live, through `localStorage` (ADR 0002, decision 8).

## The demo protocol, `isoloop-demo@1`

The site's landing recording and its feature demos draw what basic really does ([ADR 0002](../../docs/adr/0002-site-build.md), as amended). When basic runs with `?embed=1` inside a parent window (`src/demo.ts`):

- **The isolates run on their own:**
  - A counts every 0.6 s.
  - C counts primes below 200,000 every 2.5 s.
  - D sends a note every 2.4 s, plus an empty one every 11 s, which the bus rejects, since the schema needs at least one character.
- **Each isolate reports its work** to the memory topic `activity.v1`: how long each task took, and, for a read, the topic and offset. A blocked isolate publishes nothing, which is the gap the recording shows.
- **The host forwards to the parent page** what it sees through the public API: those reports, the records of `count.v1`, `note.v1` and `primes.v1`, the kernel's `isolate:state` and `isolate:crash` events, and the main thread's frame times. Standalone, none of this happens: the isolates wait for clicks and nothing is published to `activity.v1`.

Every message is an object with `v: 'isoloop-demo@1'` and a `type`. Times (`at`, `times`) are absolute milliseconds (`performance.timeOrigin + performance.now()`, or the record's `ts`).

| `type` | Fields | When |
| --- | --- | --- |
| `ready` | `isolates: { id, pool }[]` | once, at start |
| `activity` | `id`, `at`, `ms`, and optional `kind` (`task`, `read`, `rejected`), `topic`, `offset` | each task an isolate reports |
| `record` | `topic`, `offset`, `producer`, `value`, `at` | each record on `count.v1`, `note.v1`, `primes.v1` |
| `state` | `id`, `state`, `prev`, `at` | each `isolate:state` |
| `crash` | `id`, `reason`, `pool`, `at` | each `isolate:crash` |
| `frames` | `times: number[]` | main-thread frames, batched every 100 ms |

The parent sends `{ v: 'isoloop-demo@1', type: 'command', act }`, with `act` one of:
- `block-c`: C blocks its loop for 3 s, so the pool restarts.
- `crash-a`, `crash-d`: the isolate reports a crash as its own.
- `block-main`: the main thread blocks for 3 s. It's shared with the parent, so the parent's page freezes too.

The isolate commands travel on `control.v1`: the host can't click inside a surface, because the event bridge forwards only trusted input.

**Checks, both ways:**
- basic sends only to `window.parent`, with its own origin as the target, so a parent on another origin gets nothing.
- It takes commands only from `window.parent`, from its own origin, in exactly this shape. Anything else is ignored.

`e2e/demo.spec.ts` covers the reporting, the commands, malformed and foreign commands, and the standalone page.

## Running it

```bash
pnpm --filter basic dev
pnpm --filter basic e2e          # Playwright, all three engines
```
