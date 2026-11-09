// Rolling min, max and percentiles over a time window, per sensor.
import type { Summary } from '../schemas';

/** The p-th percentile (0-100) of sorted values, interpolated between ranks. */
export function percentile(sorted: ArrayLike<number>, p: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const r = (p / 100) * (n - 1);
  const lo = Math.floor(r);
  const hi = Math.ceil(r);
  const a = sorted[lo] ?? NaN;
  const b = sorted[hi] ?? NaN;
  return a + (b - a) * (r - lo);
}

export function summarize(values: readonly number[]): Summary | null {
  const last = values.at(-1);
  if (last === undefined) return null;
  const s = Float64Array.from(values).toSorted();
  return {
    last,
    min: s[0] ?? last,
    max: s[s.length - 1] ?? last,
    p50: percentile(s, 50),
    p95: percentile(s, 95),
    p99: percentile(s, 99),
  };
}

/** Timestamped values, keeping those within `windowMs` of the newest. */
export class Window {
  readonly #ts: number[] = [];
  readonly #vs: number[] = [];
  readonly windowMs: number;
  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }
  push(ts: number, v: number): void {
    this.#ts.push(ts);
    this.#vs.push(v);
    const cut = ts - this.windowMs;
    let drop = 0;
    while (drop < this.#ts.length && (this.#ts[drop] ?? 0) < cut) drop++;
    if (drop > 0) {
      this.#ts.splice(0, drop);
      this.#vs.splice(0, drop);
    }
  }
  values(): readonly number[] {
    return this.#vs;
  }
}
