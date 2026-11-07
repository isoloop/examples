// The dashboard's headless jobs, written once against a `Source`. In the
// Isoloop build each runs in its own isolate on the bus; in the native build
// all of them run on the main thread against the page's store.
import { Aggregator } from './aggregate';
import { AlertEngine } from './alerts';
import type { Feed } from './feeds/feed';
import { runFeed } from './feeds/run';
import { play } from './replay/player';
import { synth } from './replay/synth';
import { restamp } from './replay/tick';
import { SYMBOLS, type Sym } from './schemas';
import type { Source } from './streams';

export interface Stoppable {
  stop(): void;
}

export interface ReplayConfig {
  seed?: number;
  /** N× speed; 1 is real time. */
  speed?: number;
  tradesPerSecond?: number;
}

/**
 * The replay source: synthesized ticks to `trades` and `book`, and `prices`
 * kept as the feeds keep it (the book's top and the last trade). Records
 * carry the time they're played: at 10× the recording runs ahead of the wall
 * clock, and windows are wall time.
 */
export function runReplay(src: Source, c: ReplayConfig = {}): Stoppable {
  const last = new Map<string, number>();
  return play(
    synth({ seed: c.seed ?? 1, startTs: Date.now(), tradesPerSecond: c.tradesPerSecond ?? 2 }),
    (played) => {
      const tick = restamp(played, Date.now());
      const key = `${tick.rec.exchange}:${tick.rec.symbol}`;
      if (tick.kind === 'trade') {
        last.set(key, tick.rec.price);
        src.publish('trades', tick.rec);
        return;
      }
      const b = tick.rec;
      src.publish('book', b);
      const bid = b.bids[0]?.[0];
      const ask = b.asks[0]?.[0];
      if (bid === undefined || ask === undefined) return;
      const lastPrice = last.get(key) ?? (bid + ask) / 2;
      src.publish(
        'prices',
        { exchange: b.exchange, symbol: b.symbol, last: lastPrice, bid, ask, ts: b.ts },
        key,
      );
    },
    { speed: c.speed ?? 1 },
  );
}

/** One exchange's live feed into `trades`, `book` and `prices`. */
export function runLiveFeed(src: Source, feed: Feed, symbols: readonly Sym[] = SYMBOLS): Stoppable {
  return runFeed(feed, symbols, {
    trade: (t) => {
      src.publish('trades', t);
    },
    book: (b) => {
      src.publish('book', b);
    },
    quote: (q) => {
      src.publish('prices', q, `${q.exchange}:${q.symbol}`);
    },
  });
}

/** Cross-market VWAP, spread and volume per symbol, once a second, into `aggregates`. */
export function runAggregator(src: Source, everyMs = 1_000): Stoppable {
  const agg = new Aggregator();
  let windowMs = 60_000;
  const subs = [
    src.subscribe(
      'trades',
      (r) => {
        agg.addTrade(r.value);
      },
      'latest',
    ),
    src.subscribe(
      'prices',
      (r) => {
        agg.setQuote(r.value);
      },
      'earliest',
    ),
    src.subscribe(
      'filters',
      (r) => {
        windowMs = r.value.windowMs;
      },
      'earliest',
    ),
  ];
  const timer = setInterval(() => {
    const now = Date.now();
    for (const s of SYMBOLS) {
      const value = agg.compute(s, now, windowMs);
      if (value) src.publish('aggregates', value);
    }
  }, everyMs);
  return {
    stop() {
      clearInterval(timer);
      for (const u of subs) u();
    },
  };
}

/**
 * Evaluates the rules in `alertRules` against `prices` (`price`, each
 * exchange's last) and `aggregates` (`vwap`, `spread`) into `alerts`. It reads
 * `alerts` back first, so a restart doesn't fire a rule twice.
 */
export function runAlerts(src: Source): Stoppable {
  const engine = new AlertEngine();
  const fire = (list: ReturnType<AlertEngine['evaluate']>): void => {
    for (const a of list) src.publish('alerts', a);
  };
  const subs = [
    src.subscribe(
      'alertRules',
      (r) => {
        engine.setRule(r.value);
      },
      'earliest',
    ),
    src.subscribe(
      'alerts',
      (r) => {
        engine.markFired(r.value.ruleId);
      },
      'earliest',
    ),
    src.subscribe(
      'prices',
      (r) => {
        fire(engine.evaluate(r.value.symbol, 'price', r.value.last, r.value.ts));
      },
      'latest',
    ),
    src.subscribe(
      'aggregates',
      (r) => {
        const a = r.value;
        fire(engine.evaluate(a.symbol, 'vwap', a.vwap, a.ts));
        fire(engine.evaluate(a.symbol, 'spread', a.spread, a.ts));
      },
      'latest',
    ),
  ];
  return {
    stop() {
      for (const u of subs) u();
    },
  };
}
