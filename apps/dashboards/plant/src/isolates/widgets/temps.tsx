import { defineIsolate } from '@isoloop/react';
import { Temps } from '../../widgets/machine-canvas';
import { withStress } from '../../widgets/stress/withStress';

export default defineIsolate(withStress('temps', Temps));
