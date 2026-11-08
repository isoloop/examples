import { defineIsolate } from '@isoloop/react';
import { withStress } from '../../widgets/stress/withStress';
import { AlertsPanel } from '../../widgets/alerts-panel/AlertsPanel';

export default defineIsolate(withStress('alerts-panel', AlertsPanel));
