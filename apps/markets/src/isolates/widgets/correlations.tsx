import { defineIsolate } from '@isoloop/react';
import { CorrelationHeatmap } from '../../widgets/derived';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('correlations', CorrelationHeatmap));
