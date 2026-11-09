// Where the time goes, per widget category (as in the markets app, M3c
// decision 8): each widget's
// render and draw time, and on Isoloop the main-thread time applying its DOM
// changes, in milliseconds per second over the last 5 s. On native all of it
// is main-thread time; on Isoloop the work is on each isolate's own thread.
import { buildMetrics } from '#metrics';
import { useEffect, useState } from 'react';
import { CATEGORY, DATA_KINDS, OUTPUTS, type WidgetName } from '../widgets/catalog';
import type { Timing } from '../core/schemas';
import { updatesPerSec } from './updates';

const WINDOW_MS = 5_000;

const isWidget = (w: string): w is WidgetName => w in CATEGORY;
const categoryOf = (t: Timing): string => {
  if (!isWidget(t.widget)) return 'engines';
  // The feeds don't report; the FFT, stats, health and fleet engines do.
  const c = CATEGORY[t.widget];
  return `${c.data} · ${c.output}`;
};
const ORDER = [...DATA_KINDS.flatMap((d) => OUTPUTS.map((o) => `${d} · ${o}`)), 'engines'];

/**
 * The rows the panel shows for these widgets, from the start: each of their
 * categories, then the engines. Drawing them all before the first figures arrive keeps the
 * panel's height, so nothing below it moves while the page fills.
 */
export function panelCategories(widgets: readonly WidgetName[]): string[] {
  const present = new Set(widgets.map((w) => `${CATEGORY[w].data} · ${CATEGORY[w].output}`));
  return ORDER.filter((c) => c === 'engines' || present.has(c));
}

const recent: Timing[] = [];
buildMetrics.timings((t) => {
  recent.push(t);
});
const applySamples: { at: number; bySlot: Map<string, number> }[] = [];

export interface CategoryRow {
  category: string;
  slots: number;
  workMsPerSec: number;
  applyMsPerSec: number | null;
  /** The category's widgets' updates/s summed, as their headers show them. */
  updatesPerSec: number;
}

/** The rows the panel shows, and the E2E suite and the comparison read (`window.categories`). */
export function categoryRows(): CategoryRow[] {
  const now = Date.now();
  while (recent.length > 0 && (recent[0]?.ts ?? 0) < now - WINDOW_MS) recent.shift();
  const work = new Map<string, number>();
  const slots = new Map<string, Set<string>>();
  const slotCategory = new Map<string, string>();
  for (const t of recent) {
    const c = categoryOf(t);
    work.set(c, (work.get(c) ?? 0) + t.ms);
    const s = slots.get(c) ?? new Set<string>();
    s.add(t.slot);
    slots.set(c, s);
    slotCategory.set(t.slot, c);
  }
  const apply = buildMetrics.applyMs();
  let applyBy: Map<string, number> | null = null;
  if (apply) {
    applySamples.push({ at: now, bySlot: new Map(apply) });
    while (applySamples.length > 0 && (applySamples[0]?.at ?? 0) < now - WINDOW_MS)
      applySamples.shift();
    const first = applySamples[0];
    const span = (now - (first?.at ?? now)) / 1000 || 1;
    applyBy = new Map();
    for (const [slot, ms] of apply) {
      const c = slotCategory.get(slot);
      if (!c) continue;
      applyBy.set(c, (applyBy.get(c) ?? 0) + (ms - (first?.bySlot.get(slot) ?? ms)) / span);
    }
  }
  const seconds = WINDOW_MS / 1000;
  return ORDER.filter((c) => slots.has(c)).map((category) => ({
    category,
    slots: slots.get(category)?.size ?? 0,
    workMsPerSec: (work.get(category) ?? 0) / seconds,
    applyMsPerSec: applyBy ? (applyBy.get(category) ?? 0) : null,
    updatesPerSec: [...(slots.get(category) ?? [])].reduce(
      (n, slot) => n + (updatesPerSec(slot) ?? 0),
      0,
    ),
  }));
}

declare global {
  interface Window {
    categories: () => CategoryRow[];
  }
}
window.categories = categoryRows;

const f = (v: number): string => v.toFixed(1);

export function CategoryPanel({ widgets }: { widgets: readonly WidgetName[] }) {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const byCategory = new Map(rows.map((r) => [r.category, r]));
  useEffect(() => {
    const id = setInterval(() => {
      setRows(categoryRows());
    }, 1_000);
    return () => {
      clearInterval(id);
    };
  }, []);
  const native = buildMetrics.applyMs() === null;
  return (
    <details className="categories" open>
      <summary>Time per category, ms per second (last 5 s)</summary>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Slots</th>
            <th>Updates/s</th>
            <th>{native ? 'Render and draw (main thread)' : 'Render and draw (own threads)'}</th>
            <th>DOM apply (main thread)</th>
          </tr>
        </thead>
        <tbody>
          {panelCategories(widgets).map((category) => {
            const r = byCategory.get(category);
            return (
              <tr key={category} data-category={category}>
                <td>{category}</td>
                <td>{r ? r.slots : '—'}</td>
                <td data-col="updates">{r ? r.updatesPerSec : '—'}</td>
                <td data-col="work">{r ? f(r.workMsPerSec) : '—'}</td>
                <td data-col="apply">
                  {!r ? '—' : r.applyMsPerSec === null ? 'in render' : f(r.applyMsPerSec)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </details>
  );
}
