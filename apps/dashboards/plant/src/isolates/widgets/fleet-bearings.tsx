import { defineIsolate } from '@isoloop/react';
import { HottestBearings } from '../../widgets/fleet';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('fleet-bearings', HottestBearings));
