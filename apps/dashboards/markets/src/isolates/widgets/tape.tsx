import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { ExchangeTape } from '../../widgets/tables';

export default defineIsolate(withStress('tape', ExchangeTape));
