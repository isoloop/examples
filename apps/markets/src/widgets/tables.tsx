// M3c's DOM widgets (task 7): tables and strips a markets dashboard shows
// next to its charts. Each joins or filters streams and renders DOM; on
// Isoloop its DOM changes are still applied on the main thread.
import { useKeyed, useRecent } from '#env';
import { useMemo } from 'react';
import {
  EXCHANGES,
  SYMBOLS,
  type Exchange,
  type Quote,
  type Stats,
  type Trade,
} from '../core/schemas';
import { useFilters } from './useFilters';

const pct = (v: number): string => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`;
const bp = (v: number): string => `${(v * 1e4).toFixed(1)} bp`;
const px = (v: number): string => (v >= 100 ? v.toFixed(2) : v.toPrecision(5));
const time = (ts: number): string => new Date(ts).toISOString().slice(11, 19);

function latestStats(stats: readonly Stats[]): Map<string, Stats> {
  const m = new Map<string, Stats>();
  for (const s of stats) m.set(s.symbol, s);
  return m;
}

/** Last price per symbol, from the compacted quotes (latest per exchange, newest wins). */
function lastPrices(quotes: ReadonlyMap<string, Quote>): Map<string, Quote> {
  const m = new Map<string, Quote>();
  for (const q of quotes.values()) {
    const prev = m.get(q.symbol);
    if (!prev || q.ts > prev.ts) m.set(q.symbol, q);
  }
  return m;
}

/** combined: symbols ranked by how far the last price is from the 1-minute VWAP, with volatility and alerts. */
export function TopMovers() {
  const quotes = useKeyed('prices');
  const stats = useRecent('stats', 400);
  const alerts = useRecent('alerts', 200, 'earliest');
  const rows = useMemo(() => {
    const last = lastPrices(quotes);
    const st = latestStats(stats);
    const fired = new Map<string, number>();
    for (const a of alerts) fired.set(a.symbol, (fired.get(a.symbol) ?? 0) + 1);
    return SYMBOLS.flatMap((symbol) => {
      const q = last.get(symbol);
      const s = st.get(symbol);
      if (!q || !s || s.vwap <= 0) return [];
      return [
        {
          symbol,
          last: q.last,
          move: q.last / s.vwap - 1,
          vol: s.volatility,
          alerts: fired.get(symbol) ?? 0,
        },
      ];
    })
      .toSorted((a, b) => Math.abs(b.move) - Math.abs(a.move))
      .slice(0, 10);
  }, [quotes, stats, alerts]);
  return (
    <div className="table-widget" data-rows={rows.length}>
      <h3>Top movers vs 1 min VWAP</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Last</th>
            <th>vs VWAP</th>
            <th>Vol</th>
            <th>Alerts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td>{px(r.last)}</td>
              <td className={r.move >= 0 ? 'up' : 'down'}>{pct(r.move)}</td>
              <td>{bp(r.vol)}</td>
              <td>{r.alerts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** combined: per symbol, the best cross-exchange gap (buy where the ask is lowest, sell where the bid is highest), weighted by volume. */
export function ArbitrageScanner() {
  const quotes = useKeyed('prices');
  const stats = useRecent('stats', 400);
  const rows = useMemo(() => {
    const per = new Map<string, Quote[]>();
    for (const q of quotes.values()) per.set(q.symbol, [...(per.get(q.symbol) ?? []), q]);
    const st = latestStats(stats);
    const out: { symbol: string; buy: Exchange; sell: Exchange; gap: number; volume: number }[] =
      [];
    for (const [symbol, qs] of per) {
      if (qs.length < 2) continue;
      let buy = qs[0];
      let sell = qs[0];
      for (const q of qs) {
        if (buy && q.ask < buy.ask) buy = q;
        if (sell && q.bid > sell.bid) sell = q;
      }
      if (!buy || !sell || buy.exchange === sell.exchange) continue;
      out.push({
        symbol,
        buy: buy.exchange,
        sell: sell.exchange,
        gap: sell.bid / buy.ask - 1,
        volume: st.get(symbol)?.volume ?? 0,
      });
    }
    return out.toSorted((a, b) => b.gap - a.gap).slice(0, 10);
  }, [quotes, stats]);
  return (
    <div className="table-widget" data-rows={rows.length}>
      <h3>Cross-exchange gaps</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Buy</th>
            <th>Sell</th>
            <th>Gap</th>
            <th>Volume 1 min</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol}>
              <td>{r.symbol}</td>
              <td>{r.buy}</td>
              <td>{r.sell}</td>
              <td className={r.gap >= 0 ? 'up' : 'down'}>{bp(r.gap)}</td>
              <td>{r.volume.toPrecision(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** filtered: the filtered symbol's latest trades, one column per filtered exchange. */
export function ExchangeTape() {
  const f = useFilters();
  const trades = useRecent('trades', 4_000);
  const symbol = f.symbols[0];
  const cols = useMemo(() => {
    const by = new Map<Exchange, Trade[]>();
    for (const t of trades) {
      if (t.symbol !== symbol || !f.exchanges.includes(t.exchange)) continue;
      by.set(t.exchange, [...(by.get(t.exchange) ?? []), t]);
    }
    return EXCHANGES.filter((e) => f.exchanges.includes(e)).map((e) => ({
      exchange: e,
      trades: (by.get(e) ?? []).slice(-12).toReversed(),
    }));
  }, [trades, symbol, f.exchanges]);
  return (
    <div className="tape" data-rows={cols.reduce((n, c) => n + c.trades.length, 0)}>
      <h3>{symbol} tape by exchange</h3>
      <div className="tape-cols">
        {cols.map((c) => (
          <ol key={c.exchange} aria-label={c.exchange}>
            <li className="tape-head">{c.exchange}</li>
            {c.trades.map((t) => (
              <li key={t.id} className={t.side}>
                {time(t.ts)} {px(t.price)} {t.size.toPrecision(3)}
              </li>
            ))}
          </ol>
        ))}
      </div>
    </div>
  );
}

/** aggregated: one tile per symbol with its 1-minute VWAP, volume and volatility. */
export function MarketSummary() {
  const stats = useRecent('stats', 400);
  const tiles = useMemo(() => {
    const st = latestStats(stats);
    return SYMBOLS.flatMap((s) => {
      const x = st.get(s);
      return x ? [x] : [];
    });
  }, [stats]);
  return (
    <div className="summary" data-rows={tiles.length}>
      {tiles.map((s) => (
        <div key={s.symbol} className="tile">
          <b>{s.symbol.replace('-USD', '')}</b>
          <span>{px(s.vwap)}</span>
          <span>vol {bp(s.volatility)}</span>
          <span>{s.trades} trades</span>
        </div>
      ))}
    </div>
  );
}
