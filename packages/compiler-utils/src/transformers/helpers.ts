import { CompDefinition } from './../analyzers/types';
export const bitMask = (def: CompDefinition) => {
    const { propsIdentifier, aggregatedVariables} = def; 
    const ret:Record<string, number> = {};
    if (propsIdentifier) {
        const props = Object.keys(aggregatedVariables.accessed[propsIdentifier]);
        props.forEach((name, index) => ret[name] = 1 << index);
    }
    return {};
};
