import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { MarketSummary } from '../../widgets/tables';

export default defineIsolate(withStress('summary', MarketSummary));
