import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { VolumeChart } from '../../widgets/VolumeChart';

export default defineIsolate(withStress('volume', VolumeChart));
