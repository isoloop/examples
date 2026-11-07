import type { ComponentType } from 'react';
import { AlertsPanel } from './alerts-panel/AlertsPanel';
import { FiltersBar } from './FiltersBar';
import { PriceChart } from './PriceChart';
import { SpreadChart } from './SpreadChart';
import { TradesTable } from './trades-table/TradesTable';
import { VolumeChart } from './VolumeChart';
import {
  CorrelationHeatmap,
  DepthHeatmap,
  OrderFlow,
  Sparklines,
  VolatilityChart,
  VolumeProfile,
  VwapChart,
} from './derived';
import { withStress } from './stress/withStress';
import { ArbitrageScanner, ExchangeTape, MarketSummary, TopMovers } from './tables';

/** Every widget by slot name. The same components render in both builds. */
export const WIDGETS = {
  filters: withStress('filters', FiltersBar),
  price: withStress('price', PriceChart),
  spread: withStress('spread', SpreadChart),
  volume: withStress('volume', VolumeChart),
  trades: withStress('trades', TradesTable),
  'alerts-panel': withStress('alerts-panel', AlertsPanel),
  sparklines: withStress('sparklines', Sparklines),
  vwap: withStress('vwap', VwapChart),
  volatility: withStress('volatility', VolatilityChart),
  'volume-profile': withStress('volume-profile', VolumeProfile),
  correlations: withStress('correlations', CorrelationHeatmap),
  depth: withStress('depth', DepthHeatmap),
  'order-flow': withStress('order-flow', OrderFlow),
  'top-movers': withStress('top-movers', TopMovers),
  arbitrage: withStress('arbitrage', ArbitrageScanner),
  tape: withStress('tape', ExchangeTape),
  summary: withStress('summary', MarketSummary),
} as const satisfies Record<string, ComponentType>;

export type WidgetName = keyof typeof WIDGETS;
