// The dashboard's topics (ADR 0003). The bus worker imports this module by
// URL to validate; the host imports it for `contracts.list`; isolates import
// it for the topic refs. The schemas themselves are shared with the native
// builds.
import { contracts, topic } from '@isoloop/bus';
import * as s from '../core/schemas';

/** Time per widget and engine, once a second each. */
export const timings = topic('plant.timings', {
  schema: s.timing,
  retention: { kind: 'last-n', n: 1_000 },
});

export default contracts(timings);
