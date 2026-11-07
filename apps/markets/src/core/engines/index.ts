// The shared engines (M3c decision 6): derived data several widgets use,
// written once against a `Source`. On Isoloop each runs as a headless isolate
// publishing its result topic; on native, as a main-thread service.
import { SYMBOLS } from '../schemas';
import type { Stoppable } from '../services';
import type { Source } from '../streams';
import { StatsEngine } from './stats';

export const ENGINE_NAMES = ['stats'] as const;
export type EngineName = (typeof ENGINE_NAMES)[number];

/** Rolling stats per symbol over the last minute, once a second, into `stats`. */
export function runStats(src: Source, everyMs = 1_000, windowMs = 60_000): Stoppable {
  const engine = new StatsEngine();
  const off = src.subscribe(
    'trades',
    (r) => {
      engine.addTrade(r.value);
    },
    'latest',
  );
  const timer = setInterval(() => {
    const now = Date.now();
    for (const s of SYMBOLS) {
      const value = engine.compute(s, now, windowMs);
      if (value) src.publish('stats', value);
    }
  }, everyMs);
  return {
    stop() {
      clearInterval(timer);
      off();
    },
  };
}

export const ENGINES: Record<EngineName, (src: Source) => Stoppable> = {
  stats: (src) => runStats(src),
};
