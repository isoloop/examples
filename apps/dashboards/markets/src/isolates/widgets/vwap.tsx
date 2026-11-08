import { defineIsolate } from '@isoloop/react';
import { VwapChart } from '../../widgets/derived';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('vwap', VwapChart));
