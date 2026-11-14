import { topic } from '@isoloop/bus';
import { z } from 'zod';

// #region show
// contracts.ts: the bus worker, the host and the isolates all use this one module
export const note = topic('note.v1', {
  schema: z.string().trim().min(1).max(200),
  retention: { kind: 'last-n', n: 50 },
});
// #endregion
