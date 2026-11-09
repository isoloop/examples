// The three builds of one source (M3d decision 7), as the page lists them.
export type BuildName = ImportMetaEnv['PLANT_BUILD'];

export const BUILDS: readonly { name: BuildName; label: string; summary: string }[] = [
  { name: 'isoloop', label: 'Isoloop', summary: 'Isoloop: widgets and engines in isolates' },
  { name: 'native', label: 'Native', summary: 'Native: everything on the main thread' },
  {
    name: 'native-workers',
    label: 'Native + workers',
    summary: 'Native + workers: a data worker per machine, widgets on the main thread',
  },
];

export const CURRENT: BuildName = import.meta.env.PLANT_BUILD;
