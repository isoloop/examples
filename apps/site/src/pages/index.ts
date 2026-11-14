// The site's pages, by the name their index.html stub gives (`<!-- page:home -->`).
import { examplesHubPage } from './examples.tsx';
import { homePage } from './home.tsx';
import { howItWorksPage } from './how-it-works.tsx';
import { notFoundPage } from './not-found.tsx';
import type { Page } from './types.ts';

export const PAGES: Record<string, Page> = {
  home: homePage,
  'how-it-works': howItWorksPage,
  examples: examplesHubPage,
  'not-found': notFoundPage,
};

export type { Page, SiteData } from './types.ts';
