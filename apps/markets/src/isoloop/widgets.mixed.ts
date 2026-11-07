// `/mixed` (M3b task 16b): the React build's widgets, except the filters and
// the alerts panel, which run on Preact. Those are built apart by
// `vite build --mode mixed-preact` into ./preact/ (ADR 0012, isolates built
// apart) and found through its manifest, as a host would load isolates that
// someone else ships.
import { z } from 'zod';
import price from '../isolates/widgets/price?isolate';
import spread from '../isolates/widgets/spread?isolate';
import trades from '../isolates/widgets/trades?isolate';
import volume from '../isolates/widgets/volume?isolate';
import type { WidgetName } from '../widgets';
import { GRANTS, type Grants } from './grants';

// Only the React widgets are built here, so the page doesn't carry isolates it never runs.
const REACT: Partial<Record<WidgetName, string>> = { price, spread, trades, volume };

export const ISOLATES: Record<WidgetName, { grants: Grants }> = {
  filters: { grants: GRANTS.filters },
  price: { grants: GRANTS.price },
  spread: { grants: GRANTS.spread },
  volume: { grants: GRANTS.volume },
  trades: { grants: GRANTS.trades },
  'alerts-panel': { grants: GRANTS['alerts-panel'] },
};

/** Which framework each widget runs on in `/mixed`. */
export const FRAMEWORK: Record<WidgetName, 'react' | 'preact'> = {
  filters: 'preact',
  price: 'react',
  spread: 'react',
  volume: 'react',
  trades: 'react',
  'alerts-panel': 'preact',
};

const Manifest = z.object({ isolates: z.record(z.string(), z.string()) });

let manifest: Promise<Record<string, string>> | undefined;

function preactFiles(): Promise<Record<string, string>> {
  manifest ??= fetch(new URL('./preact/isoloop-manifest.json', location.href))
    .then((r) => r.json())
    .then((m: unknown) => Manifest.parse(m).isolates);
  return manifest;
}

export async function srcOf(name: WidgetName): Promise<string> {
  const react = REACT[name];
  if (react !== undefined) return react;
  const file = (await preactFiles())[name];
  if (!file) throw new Error(`no Preact isolate for ${name} in ./preact/isoloop-manifest.json`);
  return new URL(`./preact/${file}`, location.href).href;
}
