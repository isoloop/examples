import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { PriceChart } from '../../widgets/PriceChart';

export default defineIsolate(withStress('price', PriceChart));
