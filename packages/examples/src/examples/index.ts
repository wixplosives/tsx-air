import stateless from './01.stateless-parent-child/suite';
import { join } from 'path';

export const shouldBeCompiled = [
    stateless
];

export const manuallyCompiledOnly = [
];

// Used to ensure the correct path in build version
export const base = join(__dirname, '../../src/examples');
