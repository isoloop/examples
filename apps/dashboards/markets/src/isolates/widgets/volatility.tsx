import { defineIsolate } from '@isoloop/react';
import { VolatilityChart } from '../../widgets/derived';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('volatility', VolatilityChart));
