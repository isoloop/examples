// Which builds a run covers (the CI strategy). `E2E_SCOPE=react` runs the React
// pair only, as pull requests do on Firefox and WebKit; anything else runs all
// five builds.
export const FULL = process.env['E2E_SCOPE'] !== 'react';

/** The React pair, plus the rest when the run is full. */
export const inScope = <T extends string>(builds: readonly T[]): T[] =>
  builds.filter((b) => FULL || b === 'isoloop' || b === 'native');
