import type { FunctionComponent } from 'react';
import type { WidgetName } from './catalog';
import {
  AlarmFeed,
  AnomalyRanking,
  FleetPower,
  FleetStatus,
  FleetTrend,
  HottestBearings,
  LoadCorrelation,
  LoadDistribution,
} from './fleet';
import { Spectrum, Temps, Waveform } from './machine-canvas';
import { ActiveAlarms, EventLog, Gauges, HealthScore, SensorTable } from './machine-dom';
import { withStress } from './stress/withStress';

type Widget = FunctionComponent<{ config?: unknown }>;

/** Every widget by name. The same components render in every build. */
export const WIDGETS: Partial<Record<WidgetName, Widget>> = {
  spectrum: withStress('spectrum', Spectrum),
  waveform: withStress('waveform', Waveform),
  temps: withStress('temps', Temps),
  gauges: withStress('gauges', Gauges),
  health: withStress('health', HealthScore),
  alarms: withStress('alarms', ActiveAlarms),
  events: withStress('events', EventLog),
  sensors: withStress('sensors', SensorTable),
  'fleet-status': withStress('fleet-status', FleetStatus),
  'fleet-power': withStress('fleet-power', FleetPower),
  'fleet-anomaly': withStress('fleet-anomaly', AnomalyRanking),
  'fleet-correlation': withStress('fleet-correlation', LoadCorrelation),
  'fleet-alarms': withStress('fleet-alarms', AlarmFeed),
  'fleet-trend': withStress('fleet-trend', FleetTrend),
  'fleet-bearings': withStress('fleet-bearings', HottestBearings),
  'fleet-load': withStress('fleet-load', LoadDistribution),
};
