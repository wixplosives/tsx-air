import { CompDefinition } from '@tsx-air/compiler-utils';
import ts from 'typescript';
export const propsAndStateParams = (comp: CompDefinition) => {
    const props = comp.usedProps.length ? comp.propsIdentifier : undefined;
    const stores = comp.stores.map(s =>
        ts.createBindingElement(
            undefined,
            undefined,
            ts.createIdentifier(s.name),
            undefined
        ));
    const state = stores.length ? ts.createObjectBindingPattern(stores) : undefined;
    return [props, state];
};