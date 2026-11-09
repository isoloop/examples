import type { FunctionComponent } from 'react';
import type { WidgetName } from './catalog';
import { Spectrum, Temps, Waveform } from './machine-canvas';
import { withStress } from './stress/withStress';

type Widget = FunctionComponent<{ config?: unknown }>;

/** Every widget by name. The same components render in every build. */
export const WIDGETS: Partial<Record<WidgetName, Widget>> = {
  spectrum: withStress('spectrum', Spectrum),
  waveform: withStress('waveform', Waveform),
  temps: withStress('temps', Temps),
};
