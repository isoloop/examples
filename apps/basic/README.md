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

The topics are memory topics: the bus worker keeps them while the page is open, so a restarted isolate reads them again, and a reload starts empty.

## Embedding

`?embed=1` hides the site's header and footer and the page title (`ui`'s `theme.js` sets `<html data-embed>`). The landing page embeds basic this way. The theme follows the visitor's choice live, through `localStorage` (ADR 0002, decision 8).

## Running it

```bash
pnpm --filter basic dev
pnpm --filter basic e2e          # Playwright, all three engines
```
