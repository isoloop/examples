// `pnpm --filter site fetch-library`: fetches the pinned diagrams into
// .library/ (build/library.ts). The build does the same on its own; this is
// for fetching ahead, e.g. before working offline.
import { fileURLToPath } from 'node:url';
import { ensureLibrary, readPin } from '../build/library.ts';

const siteDir = fileURLToPath(new URL('..', import.meta.url));
const dir = ensureLibrary(siteDir);
console.log(`isoloop/isoloop ${readPin(siteDir).slice(0, 7)}: ${dir}`);
