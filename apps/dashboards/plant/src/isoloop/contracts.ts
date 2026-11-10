// The dashboard's topics (ADR 0003, M3d decision 5). The bus worker imports
// this module by URL to validate; the host imports it for `contracts.list`.
// Isolates use topic names only (isoloop/source.ts), so they don't load Zod.
//
// Per machine: `plant.<m>.vib` and `plant.<m>.scalars` from its feed,
// `plant.<m>.spectrum`, `.stats` and `.health` from its engines. Plant-wide:
// `plant.alarms` and `plant.events` (persistent, capped at 10,000 each, with
// `plant.cleared` marking "clear history"), `plant.fleet` from the fleet
// engine, and the page's own `plant.timings` and `plant.noise`.
import { contracts, topic } from '@isoloop/bus';
import { MACHINES } from '../core/machines';
import { MACHINE_KEEP, PERSISTENT, PLANT_KEEP } from '../core/retention';
import * as s from '../core/schemas';
import { of, type MachineStream, type PlantStream } from '../core/streams';
import { retentionOf, topicName } from './names';

const at = (k: MachineStream) => ({ retention: retentionOf(MACHINE_KEEP[k]) });

const machineTopics = MACHINES.flatMap((m) => {
  return [
    topic(topicName(of(m, 'vib')), { schema: s.vibChunk, ...at('vib') }),
    topic(topicName(of(m, 'scalars')), { schema: s.scalars, ...at('scalars') }),
    topic(topicName(of(m, 'spectrum')), { schema: s.spectrum, ...at('spectrum') }),
    topic(topicName(of(m, 'stats')), { schema: s.stats, ...at('stats') }),
    topic(topicName(of(m, 'health')), { schema: s.health, ...at('health') }),
  ];
});

const plant = (name: PlantStream) => ({
  retention: retentionOf(PLANT_KEEP[name]),
  ...(PERSISTENT.includes(name) ? { durability: 'persistent' as const } : {}),
});

const plantTopics = [
  topic(topicName('alarms'), { schema: s.alarm, ...plant('alarms') }),
  topic(topicName('events'), { schema: s.event, ...plant('events') }),
  topic(topicName('fleet'), { schema: s.fleet, ...plant('fleet') }),
  topic(topicName('timings'), { schema: s.timings, ...plant('timings') }),
  topic(topicName('noise'), { schema: s.noise, ...plant('noise') }),
  topic(topicName('cleared'), { schema: s.cleared, ...plant('cleared') }),
];

export default contracts(...machineTopics, ...plantTopics);
