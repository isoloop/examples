// Each widget as an isolate: its module URL and the topics it may use (I4).
import alerts from '../isolates/widgets/alerts?isolate';
import filters from '../isolates/widgets/filters?isolate';
import price from '../isolates/widgets/price?isolate';
import spread from '../isolates/widgets/spread?isolate';
import trades from '../isolates/widgets/trades?isolate';
import volume from '../isolates/widgets/volume?isolate';
import type { WidgetName } from '../widgets';
import { GRANTS, type Grants } from './grants';

export const ISOLATES: Record<WidgetName, { src: string; grants: Grants }> = {
  filters: { src: filters, grants: GRANTS.filters },
  price: { src: price, grants: GRANTS.price },
  spread: { src: spread, grants: GRANTS.spread },
  volume: { src: volume, grants: GRANTS.volume },
  trades: { src: trades, grants: GRANTS.trades },
  'alerts-panel': { src: alerts, grants: GRANTS['alerts-panel'] },
};

/** The module a slot's isolate runs. A promise, because `/mixed` reads some from a manifest. */
export function srcOf(name: WidgetName): Promise<string> {
  return Promise.resolve(ISOLATES[name].src);
}
