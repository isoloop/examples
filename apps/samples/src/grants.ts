import type { Kernel } from '@isoloop/host';

declare const kernel: Kernel;
declare const surface: Element;
declare const messagesUrl: string;

// #region show
kernel.spawn({
  id: 'd',
  src: messagesUrl,
  surface,
  grants: { publish: ['note.v1'], subscribe: ['count.v1', 'note.v1', 'primes.v1'] },
});
// #endregion
