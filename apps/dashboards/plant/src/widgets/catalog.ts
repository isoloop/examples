// The 72 widgets (M3d decision 2): 8 per machine and 8 for the fleet, each
// tagged with M3c's categories (what its data is × what it draws on). Plain
// data, so the layout, tests and the metrics panel can read it.
import { MACHINES, type MachineId } from '../core/machines';

export const MACHINE_WIDGETS = [
  'spectrum',
  'waveform',
  'temps',
  'gauges',
  'health',
  'alarms',
  'events',
  'sensors',
] as const;
export type MachineWidget = (typeof MACHINE_WIDGETS)[number];

export const FLEET_WIDGETS = [
  'fleet-status',
  'fleet-power',
  'fleet-anomaly',
  'fleet-correlation',
  'fleet-alarms',
  'fleet-trend',
  'fleet-bearings',
  'fleet-load',
] as const;
export type FleetWidget = (typeof FLEET_WIDGETS)[number];

export type WidgetName = MachineWidget | FleetWidget;

/** raw: records as they arrive; filtered: a view of a stream; aggregated: rolling
 * computations over one stream; combined: joins several streams. */
export const DATA_KINDS = ['raw', 'filtered', 'aggregated', 'combined'] as const;
export const OUTPUTS = ['canvas', 'dom'] as const;
export type DataKind = (typeof DATA_KINDS)[number];
export type Output = (typeof OUTPUTS)[number];

export interface Category {
  data: DataKind;
  output: Output;
}

export const CATEGORY: Record<WidgetName, Category & { title: string }> = {
  spectrum: { title: 'Vibration spectrum', data: 'aggregated', output: 'canvas' },
  waveform: { title: 'Vibration', data: 'raw', output: 'canvas' },
  temps: { title: 'Temperatures', data: 'raw', output: 'canvas' },
  gauges: { title: 'Gauges', data: 'raw', output: 'dom' },
  health: { title: 'Health', data: 'aggregated', output: 'dom' },
  alarms: { title: 'Active alarms', data: 'filtered', output: 'dom' },
  events: { title: 'Event log', data: 'filtered', output: 'dom' },
  sensors: { title: 'Sensors', data: 'aggregated', output: 'dom' },
  'fleet-status': { title: 'Status', data: 'combined', output: 'dom' },
  'fleet-power': { title: 'Total power', data: 'combined', output: 'dom' },
  'fleet-anomaly': { title: 'Anomaly ranking', data: 'combined', output: 'dom' },
  'fleet-correlation': { title: 'Load correlation', data: 'combined', output: 'canvas' },
  'fleet-alarms': { title: 'Alarm feed', data: 'combined', output: 'dom' },
  'fleet-trend': { title: 'Fleet trend', data: 'combined', output: 'canvas' },
  'fleet-bearings': { title: 'Hottest bearings', data: 'combined', output: 'dom' },
  'fleet-load': { title: 'Load distribution', data: 'combined', output: 'dom' },
};

/** A widget on the page: its slot id (`T3-spectrum`, `fleet-status`) and its machine. */
export interface Placed {
  id: string;
  widget: WidgetName;
  machine?: MachineId;
}

export const isFleet = (w: WidgetName): w is FleetWidget =>
  (FLEET_WIDGETS as readonly string[]).includes(w);

/** The page's widgets, in order: the fleet, then each machine. */
export function layout(widgets: readonly WidgetName[]): { fleet: Placed[]; machines: Placed[][] } {
  return {
    fleet: FLEET_WIDGETS.filter((w) => widgets.includes(w)).map((w) => ({ id: w, widget: w })),
    machines: MACHINES.map((machine) =>
      MACHINE_WIDGETS.filter((w) => widgets.includes(w)).map((w) => ({
        id: `${machine}-${w}`,
        widget: w,
        machine,
      })),
    ),
  };
}
