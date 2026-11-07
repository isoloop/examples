import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { SpreadChart } from '../../widgets/SpreadChart';

export default defineIsolate(withStress('spread', SpreadChart));
