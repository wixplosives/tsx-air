import { ScannedJSX } from './types';

export const isComponent = (root: ScannedJSX) =>
    root.type[0].toUpperCase() === root.type[0];
