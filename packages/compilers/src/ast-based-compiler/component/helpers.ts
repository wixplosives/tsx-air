import { CompDefinition, NodeWithVariables } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import flatMap from 'lodash/flatMap';
export const propsAndStateParams = (comp: CompDefinition) => {
    const props = comp.propsIdentifier && comp.aggregatedVariables.accessed[comp.propsIdentifier]
        ? comp.propsIdentifier
        : undefined;
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


const accessedNsVars =
    (comp: NodeWithVariables, namespace: string | undefined) => {
        if (namespace && comp.aggregatedVariables.accessed[namespace]) {
            return Object.keys(comp.aggregatedVariables.accessed[namespace]).map(key => `${namespace}.${key}`);
        }
        return [];
    };

export const accessedVars = (comp: CompDefinition) => {
    const props = accessedNsVars(comp, comp.propsIdentifier);
    const stores = flatMap(comp.stores, store =>
        accessedNsVars(comp, store.name));
    return [...props, ...stores];
};

