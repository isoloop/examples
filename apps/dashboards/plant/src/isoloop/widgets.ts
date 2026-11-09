// Each widget as an isolate: its module URL and the topics it may use (I4).
// A machine widget reads its own machine's topics; every widget publishes its
// time and the stress controls' flood.
import type { Grants } from '@isoloop/protocol';
import type { MachineId } from '../core/machines';
import spectrum from '../isolates/widgets/spectrum?isolate';
import temps from '../isolates/widgets/temps?isolate';
import waveform from '../isolates/widgets/waveform?isolate';
import gauges from '../isolates/widgets/gauges?isolate';
import health from '../isolates/widgets/health?isolate';
import alarms from '../isolates/widgets/alarms?isolate';
import events from '../isolates/widgets/events?isolate';
import sensors from '../isolates/widgets/sensors?isolate';
import fleetstatus from '../isolates/widgets/fleet-status?isolate';
import fleetpower from '../isolates/widgets/fleet-power?isolate';
import fleetanomaly from '../isolates/widgets/fleet-anomaly?isolate';
import fleetcorrelation from '../isolates/widgets/fleet-correlation?isolate';
import fleetalarms from '../isolates/widgets/fleet-alarms?isolate';
import fleettrend from '../isolates/widgets/fleet-trend?isolate';
import fleetbearings from '../isolates/widgets/fleet-bearings?isolate';
import fleetload from '../isolates/widgets/fleet-load?isolate';
import type { WidgetName } from '../widgets/catalog';
import { topicName } from './names';

const OWN = [topicName('timings'), topicName('noise')];

/** A fleet widget's grants: the fleet engine's records, the alarms and their clear marker. */
const fleet = (): Grants => ({
  publish: OWN,
  subscribe: [topicName('fleet'), topicName('alarms'), topicName('cleared')],
});

/** A machine widget's grants: its machine's topics, plus `extra`. */
const machine =
  (extra: string[] = []) =>
  (m: MachineId | undefined): Grants => ({
    publish: OWN,
    subscribe: [`plant.${(m ?? 'none').toLowerCase()}.*`, ...extra],
  });

export const ISOLATES: Partial<
  Record<WidgetName, { src: string; grants: (m: MachineId | undefined) => Grants }>
> = {
  spectrum: { src: spectrum, grants: machine() },
  waveform: { src: waveform, grants: machine() },
  temps: { src: temps, grants: machine() },
  gauges: { src: gauges, grants: machine() },
  health: { src: health, grants: machine() },
  alarms: { src: alarms, grants: machine([topicName('alarms'), topicName('cleared')]) },
  events: { src: events, grants: machine([topicName('events'), topicName('cleared')]) },
  sensors: { src: sensors, grants: machine() },
  'fleet-status': { src: fleetstatus, grants: fleet },
  'fleet-power': { src: fleetpower, grants: fleet },
  'fleet-anomaly': { src: fleetanomaly, grants: fleet },
  'fleet-correlation': { src: fleetcorrelation, grants: fleet },
  'fleet-alarms': { src: fleetalarms, grants: fleet },
  'fleet-trend': { src: fleettrend, grants: fleet },
  'fleet-bearings': { src: fleetbearings, grants: fleet },
  'fleet-load': { src: fleetload, grants: fleet },
};
