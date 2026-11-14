import type { Kernel } from '@isoloop/host';

declare const kernel: Kernel;
declare const surface: Element;
declare const primesUrl: string;
declare const messagesUrl: string;

// #region show
kernel.spawn({ id: 'c', src: primesUrl, surface, pool: 'shared' });
kernel.spawn({ id: 'd', src: messagesUrl, surface, pool: 'shared' });
// #endregion
