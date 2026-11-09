import { createKernel } from '@isoloop/host';
import workers from 'virtual:isoloop/workers';
import list from './contracts';
import contractsUrl from './contracts?isolate';

// The bus worker imports the contracts by URL; the host imports the same
// module for its list (ADR 0003, decision 4).
export const kernel = createKernel({ contracts: { url: contractsUrl, list }, workers });
