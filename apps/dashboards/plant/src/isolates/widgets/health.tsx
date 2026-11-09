import { defineIsolate } from '@isoloop/react';
import { HealthScore } from '../../widgets/machine-dom';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('health', HealthScore));
