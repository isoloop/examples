import { LIVE_SYMBOLS as SYMBOLS } from '../schemas';
import { bitstamp } from './bitstamp';
import { coinbase } from './coinbase';
import type { Feed } from './feed';
import { kraken } from './kraken';
import { okx } from './okx';

/** Every exchange the dashboard reads, in display order. */
export const feeds: readonly Feed[] = [coinbase, kraken, bitstamp, okx];
export { runFeed } from './run';
export { SYMBOLS };
