import { defineIsolate } from '@isoloop/react';
import { FleetStatus } from '../../widgets/fleet';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('fleet-status', FleetStatus));
