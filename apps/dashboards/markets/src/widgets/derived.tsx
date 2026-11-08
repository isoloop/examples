// M3c's canvas widgets (task 6). Each reads streams, derives what it shows,
// and draws on a canvas; on Isoloop each is its own isolate.
import { useRecent } from '#env';
import { useCallback, useMemo } from 'react';
import { COLORS, drawChart, type Series } from '../charts/canvas-chart';
import { drawBars, drawHeatmap, drawSparkGrid, type Spark } from '../charts/plots';
import { HORIZONS } from '../core/engines/correlations';
import { DEPTH_BUCKETS } from '../core/engines/depth';
import { SYMBOLS, type Correlations, type Depth, type Sym } from '../core/schemas';
import type { Ctx2D } from '../env/canvas';
import { Plot } from './Plot';
import { useFilters } from './useFilters';

const num = (config: unknown, k: string): number | undefined => {
  const v: unknown =
    typeof config === 'object' && config !== null ? Reflect.get(config, k) : undefined;
  return typeof v === 'number' ? v : undefined;
};
const str = (config: unknown, k: string): string | undefined => {
  const v: unknown =
    typeof config === 'object' && config !== null ? Reflect.get(config, k) : undefined;
  return typeof v === 'string' ? v : undefined;
};
const symbolOf = (config: unknown, fallback: Sym | undefined): Sym | undefined =>
  SYMBOLS.find((s) => s === str(config, 'symbol')) ?? fallback;

/**
 * filtered: every symbol's mid price on the filtered exchanges, as small
 * multiples; `config.field: 'spread'` shows each quote's bid-ask spread in bp.
 */
export function Sparklines({ config }: { config?: unknown }) {
  const field = str(config, 'field') === 'spread' ? 'spread' : 'mid';
  const f = useFilters();
  const quotes = useRecent('prices', 16_000);
  const offset = num(config, 'offset') ?? 0;
  const count = num(config, 'count') ?? SYMBOLS.length;
  const draw = useCallback(
    (ctx: Ctx2D, w: number, h: number) => {
      const per = new Map<string, number[]>();
      for (const q of quotes) {
        if (!f.exchanges.includes(q.exchange)) continue;
        const xs = per.get(q.symbol) ?? [];
        const mid = (q.bid + q.ask) / 2;
        xs.push(field === 'spread' ? ((q.ask - q.bid) / mid) * 1e4 : mid);
        per.set(q.symbol, xs);
      }
      const sparks: Spark[] = SYMBOLS.slice(offset, offset + count).map((s) => ({
        label: s,
        values: (per.get(s) ?? []).slice(-240),
      }));
      const title =
        field === 'spread'
          ? `Bid-ask spread (bp), ${f.exchanges.length} exchanges`
          : `Mid prices, ${f.exchanges.length} exchanges`;
      return drawSparkGrid(ctx, w, h, title, sparks);
    },
    [quotes, f.exchanges, offset, count, field],
  );
  return <Plot draw={draw} />;
}

/** aggregated: the filtered symbol's one-minute VWAP from the stats engine. */
export function VwapChart() {
  const f = useFilters();
  const stats = useRecent('stats', 2_000);
  const symbol = f.symbols[0];
  const draw = useCallback(
    (ctx: Ctx2D, w: number, h: number) => {
      const points = stats.filter((s) => s.symbol === symbol).map((s) => [s.ts, s.vwap] as const);
      const series: Series[] = [{ label: 'VWAP 1 min', color: COLORS[1] ?? '#fff', points }];
      drawChart(ctx, w, h, series, { title: `${symbol ?? ''} VWAP, 1 min` });
      return points.length > 1 ? `${points.length} points` : null;
    },
    [stats, symbol],
  );
  return <Plot draw={draw} />;
}

/** aggregated: each symbol's latest one-minute volatility, as bars. */
export function VolatilityChart() {
  const stats = useRecent('stats', 400);
  const draw = useCallback(
    (ctx: Ctx2D, w: number, h: number) => {
      const latest = new Map<string, number>();
      for (const s of stats) latest.set(s.symbol, s.volatility);
      const bars = SYMBOLS.filter((s) => latest.has(s)).map((s) => ({
        label: s,
        value: (latest.get(s) ?? 0) * 1e4,
      }));
      return drawBars(ctx, w, h, 'Volatility, 1 min (bp per second)', bars, { color: '#b07aa1' });
    },
    [stats],
  );
  return <Plot draw={draw} />;
}

/** aggregated: the filtered symbol's volume by price over the last minute. */
export function VolumeProfile() {
  const f = useFilters();
  const s = useLatestStats(f.symbols[0]);
  const draw = useCallback(
    (ctx: Ctx2D, w: number, h: number) => {
      const bars = s
        ? s.profile
            .map((v, i) => ({
              label: (s.lo + ((s.hi - s.lo) * (i + 0.5)) / s.profile.length).toPrecision(6),
              value: v,
            }))
            .toReversed()
        : [];
      return drawBars(ctx, w, h, `${f.symbols[0] ?? ''} volume profile, 1 min`, bars, {
        horizontal: true,
        color: '#59a14f',
      });
    },
    [s, f.symbols],
  );
  return <Plot draw={draw} />;
}

function useLatestStats(symbol: Sym | undefined) {
  const stats = useRecent('stats', 200);
  return useMemo(() => stats.findLast((s) => s.symbol === symbol), [stats, symbol]);
}

/** combined: correlation between every pair of symbols at one horizon. */
export function CorrelationHeatmap({ config }: { config?: unknown }) {
  const horizon = num(config, 'horizonMs') ?? HORIZONS[0];
  const recent = useRecent('correlations', 30);
  const c: Correlations | undefined = useMemo(
    () => recent.findLast((r) => r.horizonMs === horizon),
    [recent, horizon],
  );
  const draw = useCallback(
    (ctx: Ctx2D, w: number, h: number) => {
      const k = c?.symbols.length ?? 0;
      return drawHeatmap(
        ctx,
        w,
        h,
        `Correlation of 1 s returns, ${horizon / 60_000} min`,
        k,
        k,
        (r, col) => c?.matrix[r * k + col] ?? 0,
        { diverging: true },
      );
    },
    [c, horizon],
  );
  return <Plot draw={draw} />;
}

/** combined: book depth across exchanges over time, bids below the mid, asks above. */
export function DepthHeatmap({ config }: { config?: unknown }) {
  const f = useFilters();
  const symbol = symbolOf(config, f.symbols[0]);
  const all = useRecent('depth', 2_400);
  const draw = useCallback(
    (ctx: Ctx2D, w: number, h: number) => {
      const cols: Depth[] = all.filter((d) => d.symbol === symbol).slice(-120);
      let max = 0;
      for (const d of cols) for (const v of [...d.bids, ...d.asks]) max = Math.max(max, v);
      max ||= 1;
      const rows = DEPTH_BUCKETS * 2;
      return drawHeatmap(
        ctx,
        w,
        h,
        `${symbol ?? ''} depth over 2 min`,
        cols.length ? rows : 0,
        cols.length,
        (r, c) => {
          const d = cols[c];
          if (!d) return 0;
          const v = r < DEPTH_BUCKETS ? d.asks[DEPTH_BUCKETS - 1 - r] : d.bids[r - DEPTH_BUCKETS];
          return Math.sqrt((v ?? 0) / max);
        },
      );
    },
    [all, symbol],
  );
  return <Plot draw={draw} />;
}

/** aggregated: each symbol's order-flow imbalance over the last 30 s, (buy − sell) / total notional. */
export function OrderFlow() {
  const trades = useRecent('trades', 8_000);
  const draw = useCallback(
    (ctx: Ctx2D, w: number, h: number) => {
      const until = trades[trades.length - 1]?.ts ?? 0;
      const buy = new Map<string, number>();
      const sell = new Map<string, number>();
      for (const t of trades) {
        if (t.ts < until - 30_000) continue;
        const m = t.side === 'buy' ? buy : sell;
        m.set(t.symbol, (m.get(t.symbol) ?? 0) + t.size * t.price);
      }
      const bars = SYMBOLS.filter((s) => buy.has(s) || sell.has(s)).map((s) => {
        const b = buy.get(s) ?? 0;
        const x = sell.get(s) ?? 0;
        return { label: s, value: (b - x) / (b + x || 1) };
      });
      return drawBars(ctx, w, h, 'Order-flow imbalance, 30 s', bars, { color: '#f28e2b' });
    },
    [trades],
  );
  return <Plot draw={draw} />;
}
