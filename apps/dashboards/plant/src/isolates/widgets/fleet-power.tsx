import { defineIsolate } from '@isoloop/react';
import { FleetPower } from '../../widgets/fleet';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('fleet-power', FleetPower));
