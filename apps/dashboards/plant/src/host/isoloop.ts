// The page's own access to the data, on the main thread: the kernel's bus.
import { kernel } from '../isoloop/kernel';
import { busSource } from '../isoloop/source';

export const hostSource = busSource(kernel);

export { durability, onDurability } from '../isoloop/kernel';
