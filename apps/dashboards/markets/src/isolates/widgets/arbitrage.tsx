import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { ArbitrageScanner } from '../../widgets/tables';

export default defineIsolate(withStress('arbitrage', ArbitrageScanner));
