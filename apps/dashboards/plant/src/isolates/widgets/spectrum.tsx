import { defineIsolate } from '@isoloop/react';
import { Spectrum } from '../../widgets/machine-canvas';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('spectrum', Spectrum));
