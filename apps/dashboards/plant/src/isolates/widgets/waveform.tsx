import { defineIsolate } from '@isoloop/react';
import { Waveform } from '../../widgets/machine-canvas';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('waveform', Waveform));
