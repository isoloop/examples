// A `Source` over an isolate's bus: stream names become topics.
import type { BusClient } from '@isoloop/runtime';
import type { TopicRef } from '@isoloop/protocol';
import type { Source, StreamName } from '../core/streams';
import * as T from './topics';

const TOPICS: Record<StreamName, TopicRef<unknown, unknown, unknown, unknown>> = {
  trades: T.trades,
  book: T.book,
  prices: T.prices,
  aggregates: T.aggregates,
  alertRules: T.alertRules,
  alerts: T.alerts,
  filters: T.filters,
  noise: T.noise,
};

export function busSource(bus: BusClient): Source {
  return {
    subscribe: (stream, fn, from) =>
      bus.subscribe(
        TOPICS[stream],
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the bus validated the record against the stream's schema
        (r) => fn(r as Parameters<typeof fn>[0]),
        { from },
      ),
    publish: (stream, value, key) => {
      void bus.publish(TOPICS[stream], key === undefined ? { value } : { key, value });
    },
  };
}
