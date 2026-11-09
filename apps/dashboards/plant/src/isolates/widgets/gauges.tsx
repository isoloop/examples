import { defineIsolate } from '@isoloop/react';
import { Gauges } from '../../widgets/machine-dom';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('gauges', Gauges));
