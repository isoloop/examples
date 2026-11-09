// A `Source` over an isolate's bus, or the host kernel's: stream names become
// topics. The bus validates every record (ADR 0003, decision 10), so a topic
// handle needs only its name here.
import type { TopicRef } from '@isoloop/protocol';
import type { Rec, Source, StreamName } from '../core/streams';
import { topicName } from './names';

/** What `busSource` needs: an isolate's `ctx.bus` or the kernel itself. */
export interface BusLike {
  subscribe(
    topic: TopicRef<unknown, unknown, unknown, unknown>,
    fn: (r: { key?: string | undefined; value: unknown }) => void,
    opts: { from: 'earliest' | 'latest' },
  ): () => void;
  publish(
    topic: TopicRef<unknown, unknown, unknown, unknown>,
    r: { key?: string; value: unknown },
  ): Promise<unknown>;
}

const handles = new Map<StreamName, TopicRef<unknown, unknown, unknown, unknown>>();
function handle(s: StreamName): TopicRef<unknown, unknown, unknown, unknown> {
  let h = handles.get(s);
  if (!h) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the bus client reads only `name`
    h = { name: topicName(s), schema: { '~standard': {} } } as unknown as TopicRef<
      unknown,
      unknown,
      unknown,
      unknown
    >;
    handles.set(s, h);
  }
  return h;
}

export function busSource(bus: BusLike): Source {
  return {
    subscribe: (stream, fn, from) =>
      bus.subscribe(
        handle(stream),
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the bus validated the record against the stream's schema
        (r) => fn(r as Rec<never>),
        { from },
      ),
    publish: (stream, value, key) => {
      void bus.publish(handle(stream), key === undefined ? { value } : { key, value });
    },
  };
}
