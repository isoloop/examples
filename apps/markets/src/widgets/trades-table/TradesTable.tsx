import { useBox, useRecent } from '#env';
import { useMemo, useRef, useState } from 'react';
import { useFilters } from '../useFilters';
import { rowWindow } from './window';

const ROW = 22;
/** Trades kept across symbols; one symbol gets about a third. */
const KEEP = 30_000;

const time = (ts: number): string => new Date(ts).toISOString().slice(11, 23);

/**
 * The latest trades, newest first, virtualized: fixed-height rows and only the
 * ones in view (plus overscan) rendered. The scroll offset comes from scroll
 * events and the viewport's height from `useBox`, so no synchronous layout.
 */
export function TradesTable() {
  const f = useFilters();
  const trades = useRecent('trades', KEEP);
  const viewport = useRef<HTMLDivElement>(null);
  const { height } = useBox(viewport);
  const [scrollTop, setScrollTop] = useState(0);
  const rows = useMemo(() => {
    const symbol = f.symbols[0];
    const shown = trades.filter((t) => t.symbol === symbol && f.exchanges.includes(t.exchange));
    return shown.toReversed();
  }, [trades, f]);
  // Until the first measure, assume the slot's height so the first frame isn't empty.
  const { start, end } = rowWindow(scrollTop, height || 220, ROW, rows.length);
  return (
    <div
      ref={viewport}
      className="trades"
      onScroll={(e) => {
        setScrollTop(e.currentTarget.scrollTop);
      }}
    >
      <div className="trades-inner" style={{ height: `${rows.length * ROW}px` }}>
        {rows.slice(start, end).map((t, i) => (
          <div
            key={`${t.exchange}-${t.id}`}
            className={`trade ${t.side}`}
            data-row={start + i}
            style={{ top: `${(start + i) * ROW}px` }}
          >
            <span>{time(t.ts)}</span>
            <span>{t.exchange}</span>
            <span>{t.side}</span>
            <span className="num">{t.price.toFixed(2)}</span>
            <span className="num">{t.size.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
