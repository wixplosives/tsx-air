import { CompDefinition, NodeWithVariables, cConst, cLet } from '@tsx-air/compiler-utils';
import ts from 'typescript';
import flatMap from 'lodash/flatMap';
export const propsAndStateParams = (comp: CompDefinition, includeVolatile = false) => {
    const props = comp.propsIdentifier && comp.aggregatedVariables.accessed[comp.propsIdentifier]
        ? comp.propsIdentifier
        : undefined;

    const state = destructure(comp.stores.map(i => i.name));
    const volatile = includeVolatile ? destructure(comp.volatileVariables) : undefined;
    return [props, state, volatile];
};

export function* destructureStateAndVolatile(comp: CompDefinition) {
    if (comp.stores.length) {
        yield cLet(
            destructure(comp.stores.map(i => i.name))!,
            ts.createIdentifier('state'));
    }
    if (comp.volatileVariables.length) {
        yield cLet(
            destructure(comp.volatileVariables)!,
            ts.createIdentifier('volatile'));
    }
}

const destructure = (keys: string[]) =>
    keys.length ? ts.createObjectBindingPattern(
        keys.map(key =>
            ts.createBindingElement(
                undefined,
                undefined,
                ts.createIdentifier(key),
                undefined
            ))
    ) : undefined;


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

