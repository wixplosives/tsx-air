import nodeFs from '@file-services/node';
import { winSafePath } from '@tsx-air/utils/packages';

export const shouldBeCompiled = [
    '01.stateless-parent-child',
    '02.stateful',
    '03.thumb',
    '04.zoom'
];

// Used to ensure the correct path in build version
export const base =  nodeFs.join(winSafePath(__dirname), '../../src/examples');
