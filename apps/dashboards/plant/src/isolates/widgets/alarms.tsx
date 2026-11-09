import { defineIsolate } from '@isoloop/react';
import { ActiveAlarms } from '../../widgets/machine-dom';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('alarms', ActiveAlarms));
