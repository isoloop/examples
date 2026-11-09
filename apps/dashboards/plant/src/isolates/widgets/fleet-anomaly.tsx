import { defineIsolate } from '@isoloop/react';
import { AnomalyRanking } from '../../widgets/fleet';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('fleet-anomaly', AnomalyRanking));
