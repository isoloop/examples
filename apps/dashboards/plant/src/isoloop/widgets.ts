// Each widget as an isolate: its module URL and the topics it may use (I4).
// A machine widget reads its own machine's topics; every widget publishes its
// time and the stress controls' flood.
import type { Grants } from '@isoloop/protocol';
import type { MachineId } from '../core/machines';
import spectrum from '../isolates/widgets/spectrum?isolate';
import temps from '../isolates/widgets/temps?isolate';
import waveform from '../isolates/widgets/waveform?isolate';
import type { WidgetName } from '../widgets/catalog';
import { topicName } from './names';

const OWN = [topicName('timings'), topicName('noise')];

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
};
