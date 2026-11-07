// The dashboard's sizes (M3c decision 3): which widgets the page holds, how
// many symbols the replay synthesizes, and how fast. The same in every build.
import type { WidgetName } from '../widgets';
import { CATEGORY, type Category } from './categories';

export const SIZES = ['lite', 'normal', 'heavy'] as const;
export type Size = (typeof SIZES)[number];
export const DEFAULT_SIZE: Size = 'normal';

/** One widget on the page. `id` is its slot (and, on Isoloop, its isolate id). */
export interface Placement {
  id: string;
  widget: WidgetName;
  config?: Readonly<Record<string, string | number>>;
}

export interface SizeSpec {
  label: string;
  /** Symbols the replay synthesizes. */
  symbols: number;
  /** Multiplies the replay's trades per second. */
  rate: number;
  widgets: readonly Placement[];
}

const one = (widget: WidgetName): Placement => ({ id: widget, widget });

/** The filters bar sits above the grid; every other placement goes in the grid. */
const LITE: readonly Placement[] = [
  one('filters'),
  one('price'),
  one('spread'),
  one('volume'),
  one('trades'),
  one('alerts-panel'),
];

export const SPECS: Record<Size, SizeSpec> = {
  lite: { label: 'Lite', symbols: 3, rate: 1, widgets: LITE },
  normal: { label: 'Normal', symbols: 20, rate: 1, widgets: LITE },
  heavy: { label: 'Heavy', symbols: 20, rate: 5, widgets: LITE },
};

export const sizeOf = (params: URLSearchParams): Size =>
  SIZES.find((s) => s === params.get('size')) ?? DEFAULT_SIZE;

/**
 * The size's spec, with the test-only overrides: `symbols=<n>` and
 * `widgets=<id,…>` (keeps only those placements). Not in the UI.
 */
export function specFrom(params: URLSearchParams): SizeSpec & { size: Size } {
  const size = sizeOf(params);
  const base = SPECS[size];
  const n = Number(params.get('symbols'));
  const only = params.get('widgets')?.split(',');
  return {
    ...base,
    size,
    symbols: Number.isInteger(n) && n > 0 ? n : base.symbols,
    widgets: only ? base.widgets.filter((p) => only.includes(p.id)) : base.widgets,
  };
}

/** Placements per category, `data/output` → count. */
export function countByCategory(widgets: readonly Placement[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of widgets) {
    const c: Category = CATEGORY[p.widget];
    const k = `${c.data}/${c.output}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

/** The current page's URL for another size: the same settings, a fresh replay. */
export function sizeHref(size: Size, search: string): string {
  const p = new URLSearchParams(search);
  p.set('size', size);
  p.delete('at');
  return `?${p.toString()}`;
}
