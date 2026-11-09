import { defineIsolate } from '@isoloop/react';
import { FleetTrend } from '../../widgets/fleet';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('fleet-trend', FleetTrend));
