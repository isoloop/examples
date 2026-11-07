import { createKernel } from '@isoloop/host';
import workers from 'virtual:isoloop/workers';
import widgetCss from '../widgets/widgets.css?inline';
import list from './contracts';
import contractsUrl from './contracts?isolate';

const sheet = new CSSStyleSheet();
sheet.replaceSync(widgetCss);

// The bus worker imports the contracts by URL; the host imports the same
// module for its list (ADR 0003, decision 4).
export const kernel = createKernel({
  contracts: { url: contractsUrl, list },
  workers,
  styles: [sheet],
});
