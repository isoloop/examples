import { defineIsolate } from '@isoloop/react';
import { Sparklines } from '../../widgets/derived';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('sparklines', Sparklines));
