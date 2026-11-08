import { defineIsolate } from '@isoloop/react';
import { VolumeProfile } from '../../widgets/derived';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('volume-profile', VolumeProfile));
