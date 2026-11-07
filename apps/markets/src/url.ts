// The page URL, the same in both builds: the replay's settings, the filters
// (mirrored as they change), and where the replay is, so the toggle lands on
// the other build at the same place (M3b task 16).
import { EXCHANGES, SYMBOLS, type Filters } from './core/schemas';
import type { ReplayConfig } from './core/services';

/** `?speed=10&seed=7&tps=2&for=<ms>&at=<ms>`. */
export function replayConfig(params: URLSearchParams): ReplayConfig {
  const num = (k: string): number | undefined => {
    const v = Number(params.get(k));
    return params.has(k) && Number.isFinite(v) ? v : undefined;
  };
  const durationMs = num('for');
  const from = num('at');
  return {
    speed: num('speed') || 1,
    seed: num('seed') || 1,
    tradesPerSecond: num('tps') || 2,
    ...(durationMs === undefined ? {} : { durationMs }),
    ...(from === undefined ? {} : { from }),
  };
}

/** `?symbol=ETH-USD&ex=coinbase,okx&win=60000`, if the URL carries filters. */
export function filtersFrom(params: URLSearchParams): Filters | undefined {
  if (!params.has('symbol')) return undefined;
  const symbols = SYMBOLS.filter((s) => params.get('symbol')?.split(',').includes(s));
  const exchanges = EXCHANGES.filter((e) => params.get('ex')?.split(',').includes(e));
  const windowMs = Number(params.get('win'));
  if (symbols.length === 0 || exchanges.length === 0) return undefined;
  return {
    symbols,
    exchanges,
    windowMs: Number.isInteger(windowMs) && windowMs > 0 ? windowMs : 60_000,
  };
}

/** Mirrors the filters into the URL, without a reload or a history entry. */
export function writeFilters(f: Filters): void {
  const p = new URLSearchParams(location.search);
  p.set('symbol', f.symbols.join(','));
  p.set('ex', f.exchanges.join(','));
  p.set('win', String(f.windowMs));
  history.replaceState(history.state, '', `?${p.toString()}`);
}

let clock: { started: number; speed: number; from: number } | undefined;

/** Called when the build starts its replay. */
export function startReplayClock(c: ReplayConfig): void {
  clock = { started: performance.now(), speed: c.speed ?? 1, from: c.from ?? 0 };
}

/** Where the replay is in its recording, in ms; undefined on live feeds. */
export function replayPosition(): number | undefined {
  return clock && clock.from + (performance.now() - clock.started) * clock.speed;
}

/** The other build's URL: the same settings and filters, at the replay's position now. */
export function switchHref(other: string): string {
  const p = new URLSearchParams(location.search);
  const at = replayPosition();
  if (at !== undefined) p.set('at', String(Math.round(at)));
  return `../${other}/?${p.toString()}`;
}
