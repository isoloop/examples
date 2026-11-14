import { topic } from '@isoloop/bus';
import { z } from 'zod';

const Alarm = z.object({ machine: z.string(), level: z.enum(['warn', 'alarm']), at: z.number() });

// #region show
export const alarms = topic('alarms.v1', {
  schema: Alarm,
  retention: { kind: 'last-n', n: 10_000 },
  durability: 'persistent',
});
// #endregion
