// The page's own access to the data, on the main thread: the page's store.
import { store } from '../native/store';

export const hostSource = store;

/** The native builds keep alarms and events in localStorage; nothing degrades. */
export const durability: { degraded: string } | undefined = undefined;
export const onDurability =
  (_fn: () => void): (() => void) =>
  () => {};
