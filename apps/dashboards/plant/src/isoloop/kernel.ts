import { createKernel } from '@isoloop/host';
import workers from 'virtual:isoloop/workers';
import widgetCss from '../widgets/widgets.css?inline';
import list from './contracts';
import contractsUrl from './contracts?isolate';

const sheet = new CSSStyleSheet();
sheet.replaceSync(widgetCss);

/**
 * How long an isolate's loop may stay busy before the kernel kills its worker
 * and restarts it: under the stress controls' 3 s block, so a blocked pool
 * restarts (M3d decision 9) and catches up from the retained topics.
 */
export const KILL_AFTER_MS = 2_000;

// The bus worker imports the contracts by URL; the host imports the same
// module for its list (ADR 0003, decision 4).
export const kernel = createKernel({
  contracts: { url: contractsUrl, list },
  workers,
  styles: [sheet],
  heartbeat: { killAfterMs: KILL_AFTER_MS },
});

/** Why alarms and events are in memory only, if they are (decision 5's fallback). */
export let durability: { degraded: string } | undefined;
const listeners = new Set<() => void>();
kernel.on('bus:durability-degraded', (e) => {
  durability = { degraded: e.reason };
  for (const fn of listeners) fn();
});
export function onDurability(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
