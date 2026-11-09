// The dashboard's record shapes, shared by every build. The Isoloop build's
// topics validate with them (isoloop/contracts.ts); the native builds use the
// types.
import { z } from 'zod';

/** Time per widget and engine, once a second each (as in the markets app). */
export const timing = z.object({
  slot: z.string(),
  widget: z.string(),
  ms: z.number(),
  /** Renders committed in the last second. */
  updates: z.number().optional(),
  /** Canvas draws in the last second. */
  draws: z.number().optional(),
  ts: z.number(),
});
export type Timing = z.infer<typeof timing>;
