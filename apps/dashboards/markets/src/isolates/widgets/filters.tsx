import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { FiltersBar } from '../../widgets/FiltersBar';

export default defineIsolate(withStress('filters', FiltersBar));
