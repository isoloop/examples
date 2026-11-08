import { defineIsolate } from '@isoloop/react';
import { DepthHeatmap } from '../../widgets/derived';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('depth', DepthHeatmap));
