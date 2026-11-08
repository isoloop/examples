// Type check only: both builds' #env modules export the same hooks, so a
// widget that compiles against one compiles against the other.
import type * as Isoloop from './isoloop';
import type * as Native from './native';

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Api<M> = Omit<M, 'BUILD'>;

export const ENVS_MATCH: Same<Api<typeof Isoloop>, Api<typeof Native>> = true;
