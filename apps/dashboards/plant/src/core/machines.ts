// Plant 1 (M3d decision 1): eight fictional machines, T1 to T8, with generic
// units and limits. No vendor names and no real equipment models.

export const MACHINES = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'] as const;
export type MachineId = (typeof MACHINES)[number];

export const isMachine = (s: string): s is MachineId => MACHINES.some((m) => m === s);

/** The slow sensors, in each `scalars` row. */
export const SCALARS = ['speed', 'power', 'pressure', 'bearingTemp', 'exhaustTemp'] as const;
export type ScalarName = (typeof SCALARS)[number];

/** Units and limits, generic on purpose. */
export const SENSOR: Record<
  ScalarName | 'vib',
  { label: string; unit: string; warn?: number; alarm?: number }
> = {
  speed: { label: 'Speed', unit: 'rpm' },
  power: { label: 'Power', unit: 'kW' },
  pressure: { label: 'Pressure', unit: 'bar', warn: 9, alarm: 10 },
  bearingTemp: { label: 'Bearing temp', unit: '°C', warn: 85, alarm: 95 },
  exhaustTemp: { label: 'Exhaust temp', unit: '°C', warn: 520, alarm: 560 },
  vib: { label: 'Vibration', unit: 'mm/s', warn: 7.1, alarm: 11 },
};
