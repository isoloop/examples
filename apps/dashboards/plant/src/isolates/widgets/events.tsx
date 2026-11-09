import { defineIsolate } from '@isoloop/react';
import { EventLog } from '../../widgets/machine-dom';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('events', EventLog));
