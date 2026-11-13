// Imported last by each app's entry: the app has loaded, so the page's
// "Loading… / unsupported" notice can go.
import { NOTICE_ID } from './browser-check.ts';

document.getElementById(NOTICE_ID)?.remove();
