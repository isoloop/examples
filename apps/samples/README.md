# Samples

The code on [isoloop.dev/features/](https://isoloop.dev/features/), as files that `tsc` checks against the published `@isoloop` packages, so a sample can't drift from the API (ADR 0002, as amended). `pnpm --filter samples typecheck` runs in CI with every other package.

The site reads these files at build time (`apps/site/build/samples.ts`). A file shown in part marks the shown lines with `// #region show` and `// #endregion`; the rest only makes it type-check.
