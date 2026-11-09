import { defineIsolate } from '@isoloop/react';
import { AlarmFeed } from '../../widgets/fleet';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('fleet-alarms', AlarmFeed));
