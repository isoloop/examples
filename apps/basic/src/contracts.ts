// basic's topics (isoloop/isoloop ADR 0003). This module is the single source:
// the bus worker imports it by URL to validate, the host imports it for
// `contracts.list`, and isolates import only its types (see topics.ts).
//
// All five are memory topics: the bus worker keeps them while the page is
// open, so a restarted isolate reads them again, and a reload starts empty.
// Nothing goes to the origin's storage, which the dashboards share.
import { contracts, topic } from '@isoloop/bus';
import { z } from 'zod';

/** A's counter, each time it goes up. */
export const count = topic('count.v1', {
  schema: z.number().int().nonnegative(),
  retention: { kind: 'last-n', n: 100 },
});

/** A note sent from D. */
export const note = topic('note.v1', {
  schema: z.string().trim().min(1).max(200),
  retention: { kind: 'last-n', n: 50 },
});

/** C's prime count and how long it took. */
export const primes = topic('primes.v1', {
  schema: z.object({ count: z.number().int(), ms: z.number().nonnegative() }),
  retention: { kind: 'last-n', n: 20 },
});

/**
 * What an isolate did, published only when basic is embedded (?embed=1): the
 * landing page's recording and the feature demos draw from it (isoloop-demo@1,
 * see README). `ms` is how long the task took; `kind` marks a read of a topic
 * record (with its offset) or a publish the bus rejected.
 */
export const activity = topic('activity.v1', {
  schema: z.object({
    ms: z.number().nonnegative(),
    kind: z.enum(['task', 'read', 'rejected']).optional(),
    topic: z.string().max(40).optional(),
    offset: z.number().int().nonnegative().optional(),
  }),
  retention: { kind: 'last-n', n: 200 },
});

/**
 * The site's demo controls, published by the host only when embedded: the
 * isolate named in `to` blocks its loop or reports a crash, as its own Block
 * and Crash buttons do. (A host can't click inside a surface: the event bridge
 * forwards only trusted input.)
 */
export const control = topic('control.v1', {
  schema: z.object({ to: z.enum(['A', 'B', 'C', 'D']), act: z.enum(['block', 'crash']) }),
  retention: { kind: 'last-n', n: 10 },
});

export default contracts(count, note, primes, activity, control);
