import { CompDefinition } from './../analyzers/types';
export const bitMask = (def: CompDefinition) =>
    def.usedProps.reduce((acc: any, n, i) => ({ ...acc, [n.name]: 1 << i }), {});
