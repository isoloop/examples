import { usePublish } from '#env';
import { useEffect, useRef } from 'react';
import { symbolCount } from '../sizes/sizes';
import { EXCHANGES, SYMBOLS, type Filters } from '../core/schemas';
import { useFilters } from './useFilters';

const WINDOWS = [
  [10_000, '10 s'],
  [60_000, '1 min'],
  [300_000, '5 min'],
] as const;

/** Symbol, exchanges and window: filters.v1, shared by every widget. */
export function FiltersBar({ config }: { config?: unknown }) {
  const f = useFilters();
  const publish = usePublish('filters');
  // Each change builds on the last value, ours or one that arrived: two quick
  // changes (a symbol, then an exchange) mustn't undo each other while the
  // first is still on its way back.
  const last = useRef(f);
  useEffect(() => {
    last.current = f;
  }, [f]);
  const set = (next: Partial<Filters>): void => {
    const value = { ...last.current, ...next };
    last.current = value;
    publish(value, 'current');
  };
  const toggle = (ex: Filters['exchanges'][number]): void => {
    const now = last.current.exchanges;
    const on = now.includes(ex);
    const exchanges = on ? now.filter((e) => e !== ex) : [...now, ex];
    if (exchanges.length > 0) set({ exchanges });
  };
  return (
    <div className="filters">
      <label>
        Symbol{' '}
        <select
          name="symbol"
          value={f.symbols[0]}
          onChange={(e) => {
            const s = SYMBOLS.find((x) => x === e.currentTarget.value);
            if (s) set({ symbols: [s] });
          }}
        >
          {SYMBOLS.slice(0, symbolCount(config)).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <span className="exchanges">
        {EXCHANGES.map((ex) => (
          <label key={ex}>
            <input
              type="checkbox"
              name={`exchange-${ex}`}
              checked={f.exchanges.includes(ex)}
              onChange={() => {
                toggle(ex);
              }}
            />
            {ex}
          </label>
        ))}
      </span>
      <label>
        Window{' '}
        <select
          name="window"
          value={f.windowMs}
          onChange={(e) => {
            set({ windowMs: Number(e.currentTarget.value) });
          }}
        >
          {WINDOWS.map(([ms, label]) => (
            <option key={ms} value={ms}>
              {label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
