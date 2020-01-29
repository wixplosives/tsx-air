import { CompDefinition, cArrow, cObject } from '@tsx-air/compiler-utils';

export function generateInitialState(comp: CompDefinition) {
    return cArrow([comp.propsIdentifier || 'props'], cObject({}));
}