import { defineIsolate } from '@isoloop/react';
import { SensorTable } from '../../widgets/machine-dom';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('sensors', SensorTable));
