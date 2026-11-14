import { contracts, topic } from '@isoloop/bus';
import { z } from 'zod';

export const count = topic('count.v1', {
  schema: z.number().int().nonnegative(),
  retention: { kind: 'last-n', n: 100 },
});

export default contracts(count);
