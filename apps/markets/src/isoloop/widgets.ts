// Each widget as an isolate: its module URL and the topics it may use (I4).
import alerts from '../isolates/widgets/alerts?isolate';
import filters from '../isolates/widgets/filters?isolate';
import price from '../isolates/widgets/price?isolate';
import spread from '../isolates/widgets/spread?isolate';
import trades from '../isolates/widgets/trades?isolate';
import volume from '../isolates/widgets/volume?isolate';
import sparklines from '../isolates/widgets/sparklines?isolate';
import vwap from '../isolates/widgets/vwap?isolate';
import volatility from '../isolates/widgets/volatility?isolate';
import volumeProfile from '../isolates/widgets/volume-profile?isolate';
import correlations from '../isolates/widgets/correlations?isolate';
import depth from '../isolates/widgets/depth?isolate';
import topMovers from '../isolates/widgets/top-movers?isolate';
import arbitrage from '../isolates/widgets/arbitrage?isolate';
import tape from '../isolates/widgets/tape?isolate';
import summary from '../isolates/widgets/summary?isolate';
import type { WidgetName } from '../widgets';
import { GRANTS, type Grants } from './grants';

export const ISOLATES: Record<WidgetName, { src: string; grants: Grants }> = {
  filters: { src: filters, grants: GRANTS.filters },
  price: { src: price, grants: GRANTS.price },
  spread: { src: spread, grants: GRANTS.spread },
  volume: { src: volume, grants: GRANTS.volume },
  trades: { src: trades, grants: GRANTS.trades },
  'alerts-panel': { src: alerts, grants: GRANTS['alerts-panel'] },
  sparklines: { src: sparklines, grants: GRANTS['sparklines'] },
  vwap: { src: vwap, grants: GRANTS['vwap'] },
  volatility: { src: volatility, grants: GRANTS['volatility'] },
  'volume-profile': { src: volumeProfile, grants: GRANTS['volume-profile'] },
  correlations: { src: correlations, grants: GRANTS['correlations'] },
  depth: { src: depth, grants: GRANTS['depth'] },
  'top-movers': { src: topMovers, grants: GRANTS['top-movers'] },
  arbitrage: { src: arbitrage, grants: GRANTS['arbitrage'] },
  tape: { src: tape, grants: GRANTS['tape'] },
  summary: { src: summary, grants: GRANTS['summary'] },
};

/** The module a slot's isolate runs. A promise, because `/mixed` reads some from a manifest. */
export function srcOf(name: WidgetName): Promise<string> {
  return Promise.resolve(ISOLATES[name].src);
}
