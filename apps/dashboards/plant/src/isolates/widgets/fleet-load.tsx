import { defineIsolate } from '@isoloop/react';
import { LoadDistribution } from '../../widgets/fleet';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('fleet-load', LoadDistribution));
