// The page URL, the same in every build (M3d decisions 2, 3 and 6):
// `?rate=1|2|5` (vibration sampling, kHz), `?placement=matched|split|one|
// machine|shared-engines|own` (where the Isoloop build runs its isolates,
// `matched` by default) and `?seed=` (the generators' seed). The build switch
// keeps them.

export const RATES = [1, 2, 5] as const;
export type Rate = (typeof RATES)[number];

// `matched` is the default (M3d decision 6, revised 2026-11-13): on a mid-range
// phone `split` was the slowest Isoloop placement, and on the desktop server
// `matched` used fewer workers, less memory and less CPU for the same frames.
export const PLACEMENTS = ['matched', 'split', 'one', 'machine', 'shared-engines', 'own'] as const;
export type PlacementName = (typeof PLACEMENTS)[number];
export const DEFAULT_PLACEMENT: PlacementName = 'matched';

export interface Settings {
  rate: Rate;
  placement: PlacementName;
  seed: number;
}

export function settingsFrom(params: URLSearchParams): Settings {
  const rate = RATES.find((r) => String(r) === params.get('rate')) ?? 1;
  const placement = PLACEMENTS.find((p) => p === params.get('placement')) ?? DEFAULT_PLACEMENT;
  const seed = Number(params.get('seed'));
  return { rate, placement, seed: Number.isInteger(seed) && seed > 0 ? seed : 1 };
}

/** `search` with `key` set to `value`, as a relative href in the same build. */
export function withParam(search: string, key: string, value: string): string {
  const p = new URLSearchParams(search);
  p.set(key, value);
  return `?${p.toString()}`;
}

/** The same settings in another build. */
export function buildHref(build: string, search: string): string {
  return `../${build}/${search}`;
}

/** The page's settings, read once. */
export const SETTINGS: Settings = settingsFrom(
  new URLSearchParams(typeof location === 'undefined' ? '' : location.search),
);
