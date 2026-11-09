// "Clear history" (M3d decision 5): a marker per stream in `cleared`; the
// alarm and event widgets hide records from before it. The records stay in
// their topic until its 10,000 cap drops them.
import { useKeyed } from '#env';

/** Records of `stream` at or before this time are hidden. */
export function useClearedAt(stream: 'alarms' | 'events'): number {
  return useKeyed('cleared').get(stream)?.ts ?? 0;
}
