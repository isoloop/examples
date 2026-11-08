import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { TopMovers } from '../../widgets/tables';

export default defineIsolate(withStress('top-movers', TopMovers));
