import type { ComponentType } from 'react';
import { FiltersBar } from './FiltersBar';
import { PriceChart } from './PriceChart';
import { SpreadChart } from './SpreadChart';
import { VolumeChart } from './VolumeChart';

/** Every widget by slot name. The same components render in both builds. */
export const WIDGETS = {
  filters: FiltersBar,
  price: PriceChart,
  spread: SpreadChart,
  volume: VolumeChart,
} as const satisfies Record<string, ComponentType>;

export type WidgetName = keyof typeof WIDGETS;
