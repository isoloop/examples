import { useLatest } from '#env';
import { DEFAULT_FILTERS } from '../core/streams';
import type { Filters } from '../core/schemas';

/** The shared filters, or the defaults until someone sets them. */
export function useFilters(): Filters {
  return useLatest('filters', 'earliest') ?? DEFAULT_FILTERS;
}
