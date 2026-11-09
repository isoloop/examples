import { Store } from '../core/store';

/** The page's one store, in both native builds. */
export const store = new Store(typeof localStorage === 'undefined' ? undefined : localStorage);

declare global {
  interface Window {
    /** For the E2E suite: the native builds' store. */
    store: Store;
  }
}
window.store = store;
