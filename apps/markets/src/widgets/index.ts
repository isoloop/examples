import type { ComponentType } from 'react';
import { AlertsPanel } from './alerts-panel/AlertsPanel';
import { FiltersBar } from './FiltersBar';
import { PriceChart } from './PriceChart';
import { SpreadChart } from './SpreadChart';
import { TradesTable } from './trades-table/TradesTable';
import { VolumeChart } from './VolumeChart';

/** Every widget by slot name. The same components render in both builds. */
export const WIDGETS = {
  filters: FiltersBar,
  price: PriceChart,
  spread: SpreadChart,
  volume: VolumeChart,
  trades: TradesTable,
  'alerts-panel': AlertsPanel,
} as const satisfies Record<string, ComponentType>;

export type WidgetName = keyof typeof WIDGETS;
