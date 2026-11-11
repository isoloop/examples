// Main-thread apply time per surface, from periodic snapshots.
//
// The compositor reports, per surface, how many batches it has applied and
// how long the last frame with work took (`SurfaceStats.lastFrameMs`); it
// keeps no running total. Between two samples, the surface's new batches are
// counted at its last frame's time each. A frame that applied several of a
// surface's batches counts their combined time once per batch, so this
// leans high when batches bunch up in a frame. Against the exact per-frame
// sum it read 2-5% high in Chromium (matched, split and one; 1 and 5 kHz).

/** The part of an isolate snapshot this reads. */
export type ApplySource = {
  readonly id: string;
  readonly surface?: { readonly applied: number; readonly lastFrameMs: number } | undefined;
};

/** What the last sample saw of a surface. */
export type ApplySeen = { applied: number };

/** Adds each surface's apply time since the last sample to `totals` (ms). */
export function applyTotals(
  isolates: Iterable<ApplySource>,
  seen: Map<string, ApplySeen>,
  totals: Map<string, number>,
): void {
  for (const i of isolates) {
    const s = i.surface;
    if (!s) continue;
    const prev = seen.get(i.id);
    // A restart starts the count again from 0.
    const batches = prev === undefined || s.applied < prev.applied ? 0 : s.applied - prev.applied;
    seen.set(i.id, { applied: s.applied });
    if (batches > 0) totals.set(i.id, (totals.get(i.id) ?? 0) + batches * s.lastFrameMs);
    else if (!totals.has(i.id)) totals.set(i.id, 0);
  }
}
