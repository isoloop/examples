import type { VNode } from 'preact';
import type { Diagram } from '../../build/diagrams.ts';
import type { Example } from '../../build/examples.ts';
import type { Current } from 'ui/components';

/** What every page is rendered from, gathered at build time. */
export interface SiteData {
  examples: Example[];
  diagrams: Diagram[];
  /** The isoloop/isoloop sha the diagrams come from. */
  pin: string;
}

export interface Page {
  /** The page's own path, for the canonical URL and og:url. */
  path: string;
  /** The header's section, if the page is one. */
  section?: Current;
  head: { title: string; description: string; home?: boolean };
  render: (data: SiteData) => VNode;
}
