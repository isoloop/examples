import { SYMBOLS } from '../schemas';
import { coinbase } from './coinbase';
import type { Feed } from './feed';
import { kraken } from './kraken';

/** Every exchange the dashboard reads, in display order. */
export const feeds: readonly Feed[] = [coinbase, kraken];
export { runFeed } from './run';
export { SYMBOLS };
