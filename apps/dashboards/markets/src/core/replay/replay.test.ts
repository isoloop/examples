import { describe, expect, it } from 'vitest';
import { book, trade } from '../schemas';
import { play, type Clock } from './player';
import { synth } from './synth';
import type { Tick } from './tick';

/** A clock the test moves by hand. */
function manualClock(): Clock & { advance(ms: number): void } {
  let now = 0;
  let timers: { at: number; fn: () => void; id: number }[] = [];
  let next = 0;
  return {
    now: () => now,
    after(ms, fn) {
      const id = ++next;
      timers.push({ at: now + ms, fn, id });
      return () => {
        timers = timers.filter((t) => t.id !== id);
      };
    },
    advance(ms) {
      const until = now + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const t = timers[0];
        if (!t || t.at > until) break;
        timers.shift();
        now = t.at;
        t.fn();
      }
      now = until;
    },
  };
}

const take = (n: number, seed = 7): Tick[] => [...synth({ seed, durationMs: 10_000 })].slice(0, n);

describe('synth', () => {
  it('is deterministic for a seed and differs across seeds', () => {
    expect(take(200)).toEqual(take(200));
    expect(take(200, 8)).not.toEqual(take(200));
  });

  it('yields valid records in time order', () => {
    const ticks = [...synth({ seed: 3, durationMs: 5_000 })];
    expect(ticks.length).toBeGreaterThan(100);
    let t = 0;
    for (const tick of ticks) {
      expect(tick.t).toBeGreaterThanOrEqual(t);
      t = tick.t;
      const ok = tick.kind === 'trade' ? trade.safeParse(tick.rec) : book.safeParse(tick.rec);
      expect(ok.success).toBe(true);
    }
  });

  it('keeps every book uncrossed, best level first', () => {
    for (const tick of synth({ seed: 5, durationMs: 3_000 })) {
      if (tick.kind !== 'book') continue;
      const [bid] = tick.rec.bids;
      const [ask] = tick.rec.asks;
      expect(bid && ask && bid[0] < ask[0]).toBe(true);
    }
  });
});

const run = (speed: number): { order: Tick[]; at: number[] } => {
  const clock = manualClock();
  const order: Tick[] = [];
  const at: number[] = [];
  play(
    synth({ seed: 11, durationMs: 4_000 }),
    (tick) => {
      order.push(tick);
      at.push(clock.now());
    },
    { speed, clock },
  );
  clock.advance(4_000 / speed + 1);
  return { order, at };
};

describe('play', () => {
  it('publishes the same records in the same order at 1× and 10×', () => {
    const one = run(1);
    const ten = run(10);
    expect(ten.order).toEqual(one.order);
    expect(one.order.length).toBeGreaterThan(50);
  });

  it('emits each tick no earlier than t / speed', () => {
    const { order, at } = run(10);
    order.forEach((tick, i) => {
      expect(at[i]).toBeGreaterThanOrEqual(tick.t / 10);
    });
  });

  it('starts part-way in: skips ticks before `from`, plays the rest on time', () => {
    const all = run(10).order;
    const clock = manualClock();
    const order: Tick[] = [];
    const at: number[] = [];
    play(
      synth({ seed: 11, durationMs: 4_000 }),
      (tick) => {
        order.push(tick);
        at.push(clock.now());
      },
      { speed: 10, clock, from: 2_000 },
    );
    clock.advance(2_000 / 10 + 1);
    expect(order).toEqual(all.filter((t) => t.t >= 2_000));
    order.forEach((tick, i) => {
      expect((at[i] ?? 0) + 1e-9).toBeGreaterThanOrEqual((tick.t - 2_000) / 10);
    });
  });

  it('stops', () => {
    const clock = manualClock();
    let n = 0;
    const p = play(synth({ seed: 1 }), () => n++, { clock });
    clock.advance(1_000);
    p.stop();
    const seen = n;
    clock.advance(10_000);
    expect(n).toBe(seen);
  });
});

/** 500 ms returns of one exchange's book mid, per symbol. */
function returns(symbols: readonly string[]): Map<string, number[]> {
  const last = new Map<string, number>();
  const out = new Map<string, number[]>();
  for (const tick of synth({ seed: 11, durationMs: 600_000 })) {
    if (tick.kind !== 'book' || tick.rec.exchange !== 'coinbase') continue;
    const { symbol, bids, asks } = tick.rec;
    if (!symbols.includes(symbol)) continue;
    const mid = ((bids[0]?.[0] ?? 0) + (asks[0]?.[0] ?? 0)) / 2;
    const prev = last.get(symbol);
    if (prev !== undefined) out.set(symbol, [...(out.get(symbol) ?? []), Math.log(mid / prev)]);
    last.set(symbol, mid);
  }
  return out;
}
const corr = (a: number[], b: number[]): number => {
  const n = Math.min(a.length, b.length);
  const ma = a.slice(0, n).reduce((x, y) => x + y, 0) / n;
  const mb = b.slice(0, n).reduce((x, y) => x + y, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = (a[i] ?? 0) - ma;
    const y = (b[i] ?? 0) - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return num / Math.sqrt(da * db);
};

describe('synth, twenty symbols', () => {
  it('synthesizes all twenty, valid', () => {
    const seen = new Set<string>();
    for (const tick of synth({ seed: 2, durationMs: 2_000 })) {
      seen.add(tick.rec.symbol);
      const ok = tick.kind === 'trade' ? trade.safeParse(tick.rec) : book.safeParse(tick.rec);
      expect(ok.success).toBe(true);
    }
    expect(seen.size).toBe(20);
  });

  it('moves symbols in one sector together more than across sectors', () => {
    const r = returns(['SOL-USD', 'AVAX-USD', 'XRP-USD']);
    const same = corr(r.get('SOL-USD') ?? [], r.get('AVAX-USD') ?? []);
    const across = corr(r.get('SOL-USD') ?? [], r.get('XRP-USD') ?? []);
    expect(same).toBeGreaterThan(0.5);
    expect(same).toBeLessThan(0.95);
    expect(across).toBeGreaterThan(0);
    expect(across).toBeLessThan(same);
  });

  it('trades busier symbols more often', () => {
    const count = new Map<string, number>();
    for (const tick of synth({ seed: 4, durationMs: 60_000 })) {
      if (tick.kind === 'trade') count.set(tick.rec.symbol, (count.get(tick.rec.symbol) ?? 0) + 1);
    }
    expect(count.get('BTC-USD') ?? 0).toBeGreaterThan(3 * (count.get('AAVE-USD') ?? 0));
  });
});
