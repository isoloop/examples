// Imported first by each app's entry, before the app itself. ES modules
// evaluate in import order and stop at the first one that throws, so when the
// page's browser check (browser-check.ts) found something missing, this throws
// and the app never starts; the page's notice already names what's missing.
import { UNSUPPORTED_GLOBAL } from './browser-check.ts';

const missing: unknown = Reflect.get(window, UNSUPPORTED_GLOBAL);
if (Array.isArray(missing) && missing.length > 0) {
  throw new Error(`Unsupported browser, missing: ${missing.join(', ')}`);
}
