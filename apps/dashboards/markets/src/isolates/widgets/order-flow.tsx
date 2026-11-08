import { defineIsolate } from '@isoloop/react';
import { OrderFlow } from '../../widgets/derived';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('order-flow', OrderFlow));
