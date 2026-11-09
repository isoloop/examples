// The messages between the page and its data workers in the native + workers
// build (M3d decision 7): plain `postMessage`, written as a careful team
// would without Isoloop.
import type { MachineId } from '../core/machines';
import type { StreamName } from '../core/streams';

/** Page to a machine's data worker: what to run. */
export interface MachineStart {
  type: 'start';
  machine: MachineId;
  seed: number;
  rateKHz: number;
}

/** A record, either way: the page relays a record into a worker's store, a worker publishes one. */
export interface RecordMessage {
  type: 'record';
  stream: StreamName;
  key?: string;
  value: unknown;
}

export type ToWorker = MachineStart | RecordMessage;
export type FromWorker = RecordMessage;
