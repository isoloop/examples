import type { ComponentType } from 'react';
import { AlertsPanel } from './alerts-panel/AlertsPanel';
import { FiltersBar } from './FiltersBar';
import { PriceChart } from './PriceChart';
import { SpreadChart } from './SpreadChart';
import { TradesTable } from './trades-table/TradesTable';
import { VolumeChart } from './VolumeChart';
import { withStress } from './stress/withStress';

/** Every widget by slot name. The same components render in both builds. */
export const WIDGETS = {
  filters: withStress('filters', FiltersBar),
  price: withStress('price', PriceChart),
  spread: withStress('spread', SpreadChart),
  volume: withStress('volume', VolumeChart),
  trades: withStress('trades', TradesTable),
  'alerts-panel': withStress('alerts-panel', AlertsPanel),
} as const satisfies Record<string, ComponentType>;

export type WidgetName = keyof typeof WIDGETS;
