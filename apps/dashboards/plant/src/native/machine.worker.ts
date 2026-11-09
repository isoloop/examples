// A machine's data worker in the native + workers build: its feed and its
// engines against a store of its own; every record they publish goes to the
// page.
import { runMachineEngines } from '../core/engines';
import { runFeed } from '../core/sensors/feed';
import { Store } from '../core/store';
import type { Rec, Source, StreamName, ValueOf } from '../core/streams';
import type { FromWorker, ToWorker } from './protocol';

const local = new Store();
const post = (m: FromWorker): void => {
  postMessage(m);
};

/** The worker's store, forwarding each publish to the page. */
const source: Source = {
  subscribe: <S extends StreamName>(
    s: S,
    fn: (r: Rec<ValueOf<S>>) => void,
    from: 'earliest' | 'latest',
  ) => local.subscribe(s, fn, from),
  publish: (stream, value, key) => {
    local.publish(stream, value, key);
    post(
      key === undefined
        ? { type: 'record', stream, value }
        : { type: 'record', stream, key, value },
    );
  },
};

addEventListener('message', (e: MessageEvent<ToWorker>) => {
  const m = e.data;
  if (m.type !== 'start') return;
  runFeed(source, { machine: m.machine, seed: m.seed, rateKHz: m.rateKHz });
  runMachineEngines(source, m.machine, m.rateKHz);
});
