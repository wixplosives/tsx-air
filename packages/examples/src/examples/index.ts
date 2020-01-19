import { join } from 'path';

export const shouldBeCompiled = [
    '01.stateless-parent-child',
    '02.stateful'
];

export const manuallyCompiledOnly = [
];

// Used to ensure the correct path in build version
export const base = join(__dirname, '../../src/examples');
