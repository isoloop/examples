// Which builds a run covers (the CI strategy). `E2E_SCOPE=react` runs the
// fewer builds pull requests run on Firefox and WebKit (here: Isoloop and
// native); anything else runs all three.
export const FULL = process.env['E2E_SCOPE'] !== 'react';

export const BUILDS = ['isoloop', 'native', 'native-workers'] as const;

/** Isoloop and native, plus native + workers when the run is full. */
export const inScope = <T extends string>(builds: readonly T[]): T[] =>
  builds.filter((b) => FULL || b === 'isoloop' || b === 'native');
