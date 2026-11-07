// Each widget's updates/s for its header (M3c task 9b): the renders it counted
// in its own code over the last second, from `timings`. A widget whose report
// is late (its thread is busy, or it is restarting) shows 0: nothing of it
// reached the page in that time.
import { buildMetrics } from '#metrics';
import { useEffect, useState } from 'react';

/** Reports come once a second; one later than this counts as none. */
export const STALE_MS = 1_500;

const last = new Map<string, { updates: number; at: number }>();
buildMetrics.timings((t) => {
  if (t.updates !== undefined) last.set(t.slot, { updates: t.updates, at: performance.now() });
});

/** The slot's updates in the last second, or 0 if its report is late; `null` before the first. */
export function updatesPerSec(slot: string): number | null {
  const r = last.get(slot);
  if (!r) return null;
  return performance.now() - r.at > STALE_MS ? 0 : r.updates;
}

export function useUpdatesPerSec(slot: string): number | null {
  const [n, setN] = useState(() => updatesPerSec(slot));
  useEffect(() => {
    const id = setInterval(() => {
      setN(updatesPerSec(slot));
    }, 250);
    return () => {
      clearInterval(id);
    };
  }, [slot]);
  return n;
}
