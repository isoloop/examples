// The fleet worker in the native + workers build: the page relays each
// machine's health records into its store; the fleet engine's records go back.
import { runFleet } from '../core/engines';
import { Store } from '../core/store';
import type { Source } from '../core/streams';
import type { FromWorker, ToWorker } from './protocol';

const local = new Store();
const source: Source = {
  subscribe: (s, fn, from) => local.subscribe(s, fn, from),
  publish: (stream, value, key) => {
    const m: FromWorker =
      key === undefined
        ? { type: 'record', stream, value }
        : { type: 'record', stream, key, value };
    postMessage(m);
  },
};

addEventListener('message', (e: MessageEvent<ToWorker>) => {
  const m = e.data;
  if (m.type !== 'record') return;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the page relays `stream`'s records
  local.publish(m.stream, m.value as never, m.key);
});

runFleet(source);
