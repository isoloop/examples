import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { TradesTable } from '../../widgets/trades-table/TradesTable';

export default defineIsolate(withStress('trades', TradesTable));
