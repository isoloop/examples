// The dashboard's sizes (M3c decision 3): which widgets the page holds, how
// many symbols the replay synthesizes, and how fast. The same in every build.
import type { EngineName } from '../core/engines';
import type { ReplayConfig } from '../core/services';
import { replayConfig } from '../url';
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
  /** The shared engines the size's widgets read from. */
  engines: readonly EngineName[];
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
  lite: { label: 'Lite', symbols: 3, rate: 1, widgets: LITE, engines: [] },
  normal: {
    label: 'Normal',
    symbols: 20,
    rate: 1,
    widgets: LITE,
    engines: ['stats', 'correlations', 'depth'],
  },
  heavy: {
    label: 'Heavy',
    symbols: 20,
    rate: 5,
    widgets: LITE,
    engines: ['stats', 'correlations', 'depth'],
  },
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
  const symbols = Number.isInteger(n) && n > 0 ? Math.min(n, 20) : base.symbols;
  const placed = only ? base.widgets.filter((p) => only.includes(p.id)) : base.widgets;
  return {
    ...base,
    size,
    symbols,
    // The controls list the symbols the replay synthesizes.
    widgets: placed.map((p) =>
      SYMBOL_PICKERS.has(p.widget)
        ? Object.assign({}, p, { config: Object.assign({}, p.config, { symbols }) })
        : p,
    ),
  };
}

const SYMBOL_PICKERS: ReadonlySet<WidgetName> = new Set(['filters', 'alerts-panel']);

/** The replay's settings for the page's size: its symbols, and its rate times `?tps=`. */
export function replayFor(params: URLSearchParams): ReplayConfig {
  const spec = specFrom(params);
  const c = replayConfig(params);
  return { ...c, symbols: spec.symbols, tradesPerSecond: (c.tradesPerSecond ?? 2) * spec.rate };
}

/** How many symbols a control lists, from its placement's config. */
export function symbolCount(config: unknown): number {
  const n: unknown =
    typeof config === 'object' && config !== null ? Reflect.get(config, 'symbols') : undefined;
  return typeof n === 'number' ? n : 3;
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
