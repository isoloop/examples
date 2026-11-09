import { defineIsolate } from '@isoloop/react';
import { LoadCorrelation } from '../../widgets/fleet';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('fleet-correlation', LoadCorrelation));
